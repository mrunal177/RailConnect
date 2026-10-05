import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { pool } from './src/db/index.ts';
import { requireAuth, requireRole, AuthRequest } from './src/middleware/auth.ts';
import { predictWaitlistConfirmation, analyzeSentiment } from './src/lib/ml.ts';
import { STATIONS_DB } from './src/lib/tracking.ts';
import { getRailRadarTracking } from './src/lib/railradar.ts';

dotenv.config();

/**
 * Builds the API application without opening a network listener. Vercel invokes
 * this through api/[...path].ts; local development uses startServer below.
 */
export async function createApp(serveFrontend = false) {
  const app = express();

  app.use(express.json());

  // ----------------------------------------------------
  // 1. HEALTH & ENVIRONMENT CONFIG API
  // ----------------------------------------------------
  app.get('/api/config', (_req, res) => {
    res.json({
      // RailRadar and weather credentials remain server-only.
      maptilerApiKey: process.env.VITE_MAPTILER_API_KEY || '',
      trackingMode: process.env.RAILRADAR_API_KEY ? 'live' : 'demo',
      systemTime: '2026-09-27T06:01:07-07:00',
    });
  });

  // ----------------------------------------------------
  // 2. AUTH / USER PROFILE APIS
  // ----------------------------------------------------
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        'SELECT id, uid, name, email, phone, role, created_at FROM users WHERE id = $1',
        [req.user?.dbUserId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User record not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ error: 'Internal server error while fetching user profile' });
    }
  });

  app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { name, phone } = req.body;
      const result = await pool.query(
        'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone) WHERE id = $3 RETURNING id, uid, name, email, phone, role',
        [name, phone, req.user?.dbUserId]
      );
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // ----------------------------------------------------
  // 3. TRAIN SEARCH & INVENTORY APIS
  // ----------------------------------------------------
  app.get('/api/trains/search', async (req: Request, res: Response) => {
    try {
      const { from, to, date, travelClass } = req.query;
      let query = 'SELECT * FROM trains WHERE 1=1';
      const params: any[] = [];

      if (from) {
        params.push(`%${from}%`);
        query += ` AND source ILIKE $${params.length}`;
      }
      if (to) {
        params.push(`%${to}%`);
        query += ` AND destination ILIKE $${params.length}`;
      }

      query += ' ORDER BY departure_time ASC';
      const result = await pool.query(query, params);

      // Enrich with real-time seat availability & waitlist stats
      const journeyDateStr = (date as string) || '2026-09-28';
      const enrichedTrains = await Promise.all(
        result.rows.map(async (train: any) => {
          // Check how many seats booked for this date
          const bookedCountRes = await pool.query(
            'SELECT COUNT(*) as count FROM seats WHERE train_id = $1 AND journey_date = $2 AND is_booked = true',
            [train.id, journeyDateStr]
          );
          const bookedSeats = parseInt(bookedCountRes.rows[0].count, 10);
          const availableSeats = Math.max(0, train.total_seats - bookedSeats);
          
          let waitlistCount = 0;
          let confirmationPrediction = null;

          if (availableSeats === 0) {
            const wlRes = await pool.query(
              "SELECT COUNT(*) as count FROM bookings WHERE train_id = $1 AND journey_date = $2 AND booking_status = 'WAITLISTED'",
              [train.id, journeyDateStr]
            );
            waitlistCount = parseInt(wlRes.rows[0].count, 10) + 1;
            confirmationPrediction = predictWaitlistConfirmation({
              trainNumber: train.train_number,
              journeyDate: journeyDateStr,
              travelClass: (travelClass as string) || '3A',
              currentWaitlist: waitlistCount,
              totalSeats: train.total_seats,
            });
          }

          return {
            ...train,
            availableSeats,
            waitlistCount,
            confirmationPrediction,
          };
        })
      );

      res.json(enrichedTrains);
    } catch (err: any) {
      console.error('Error searching trains:', err);
      res.status(500).json({ error: 'Failed to search trains' });
    }
  });

  app.get('/api/trains/:id', async (req: Request, res: Response) => {
    try {
      const trainId = parseInt(req.params.id, 10);
      const result = await pool.query('SELECT * FROM trains WHERE id = $1', [trainId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Train not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error fetching train details:', err);
      res.status(500).json({ error: 'Failed to fetch train' });
    }
  });

  // Seat Map API with row-locking check
  app.get('/api/trains/:id/seats', async (req: Request, res: Response) => {
    try {
      const trainId = parseInt(req.params.id, 10);
      const date = (req.query.date as string) || '2026-09-28';
      const travelClass = (req.query.travelClass as string) || '3A';

      // Query booked seats from database
      const bookedRes = await pool.query(
        'SELECT seat_number, is_booked FROM seats WHERE train_id = $1 AND journey_date = $2',
        [trainId, date]
      );
      const bookedMap = new Map<string, boolean>();
      bookedRes.rows.forEach((r: any) => bookedMap.set(r.seat_number, r.is_booked));

      // Standard coach layout: 48 seats (Rows A to L, 4 seats per row)
      const seatLayout: { seatNumber: string; status: 'AVAILABLE' | 'BOOKED' | 'LOCKED' }[] = [];
      const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
      
      for (const row of rows) {
        for (let num = 1; num <= 4; num++) {
          const seatNum = `${row}${num}`;
          const isBooked = bookedMap.get(seatNum) || false;
          seatLayout.push({
            seatNumber: seatNum,
            status: isBooked ? 'BOOKED' : 'AVAILABLE',
          });
        }
      }

      res.json({
        trainId,
        journeyDate: date,
        travelClass,
        totalSeats: seatLayout.length,
        availableCount: seatLayout.filter((s) => s.status === 'AVAILABLE').length,
        seats: seatLayout,
      });
    } catch (err: any) {
      console.error('Error fetching seats:', err);
      res.status(500).json({ error: 'Failed to fetch seats map' });
    }
  });

  // ----------------------------------------------------
  // 4. ACID CONCURRENCY-PROTECTED BOOKING TRANSACTION
  // ----------------------------------------------------
  app.post('/api/bookings/reserve', requireAuth, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
      const {
        trainId,
        journeyDate,
        passengerName,
        passengerAge,
        passengerGender,
        seatNumber,
        travelClass,
        paymentMethod,
      } = req.body;

      if (!trainId || !journeyDate || !passengerName || !seatNumber) {
        return res.status(400).json({ error: 'Missing required booking information' });
      }

      // ACID TRANSACTION BEGIN
      await client.query('BEGIN');

      // 1. Verify train exists
      const trainCheck = await client.query('SELECT * FROM trains WHERE id = $1 FOR SHARE', [trainId]);
      if (trainCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Specified train does not exist' });
      }
      const train = trainCheck.rows[0];

      // 2. Concurrency Check: Check if seat is already booked or lock the seat row
      const seatCheck = await client.query(
        'SELECT * FROM seats WHERE train_id = $1 AND journey_date = $2 AND seat_number = $3 FOR UPDATE',
        [trainId, journeyDate, seatNumber]
      );

      if (seatCheck.rows.length > 0 && seatCheck.rows[0].is_booked) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Seat ${seatNumber} is temporarily unavailable or just booked by another passenger. Please choose another seat.`,
        });
      }

      // 3. Generate unique PNR
      const pnrRes = await client.query('SELECT generate_pnr() AS pnr');
      const pnr = pnrRes.rows[0].pnr;

      // 4. Determine fare
      let classMultiplier = 1.0;
      if (travelClass === '1A') classMultiplier = 2.4;
      if (travelClass === '2A') classMultiplier = 1.8;
      if (travelClass === '3A') classMultiplier = 1.3;
      if (travelClass === 'CC') classMultiplier = 1.1;
      if (travelClass === 'SL') classMultiplier = 0.6;
      const calculatedFare = Math.round(parseFloat(train.base_fare) * classMultiplier);

      // 5. Create Booking record
      const bookingInsert = await client.query(
        `INSERT INTO bookings (
          user_id, train_id, pnr, journey_date, passenger_name, passenger_age, 
          passenger_gender, seat_number, travel_class, fare, booking_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'CONFIRMED')
        RETURNING *`,
        [
          req.user?.dbUserId,
          trainId,
          pnr,
          journeyDate,
          passengerName,
          passengerAge || 28,
          passengerGender || 'Other',
          seatNumber,
          travelClass || '3A',
          calculatedFare,
        ]
      );
      const booking = bookingInsert.rows[0];

      // 6. Update or insert seat row
      if (seatCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO seats (train_id, journey_date, seat_number, travel_class, is_booked, booked_by_user_id, booking_id)
           VALUES ($1, $2, $3, $4, true, $5, $6)`,
          [trainId, journeyDate, seatNumber, travelClass || '3A', req.user?.dbUserId, booking.id]
        );
      } else {
        await client.query(
          `UPDATE seats SET is_booked = true, booked_by_user_id = $1, booking_id = $2, locked_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [req.user?.dbUserId, booking.id, seatCheck.rows[0].id]
        );
      }

      // 7. Process realistic payment transaction
      const txnRef = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentInsert = await client.query(
        `INSERT INTO payments (
          booking_id, amount, payment_method, payment_status, transaction_reference, payment_gateway
        ) VALUES ($1, $2, $3, 'SUCCESS', $4, 'SMART_RAIL_GATEWAY')
        RETURNING *`,
        [booking.id, calculatedFare, paymentMethod || 'UPI', txnRef]
      );
      const payment = paymentInsert.rows[0];

      // COMMIT TRANSACTION
      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Ticket booked successfully!',
        booking,
        payment,
        train,
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('ACID booking transaction error:', err);
      res.status(500).json({ error: 'Transaction failed and was safely rolled back: ' + err.message });
    } finally {
      client.release();
    }
  });

  // ----------------------------------------------------
  // 5. CANCELLATION & REFUND WORKFLOW (ACID TRANSACTION)
  // ----------------------------------------------------
  app.post('/api/bookings/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
    const client = await pool.connect();
    try {
      const bookingId = parseInt(req.params.id, 10);
      await client.query('BEGIN');

      // 1. Fetch booking with locking
      const bookingRes = await client.query(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
        [bookingId]
      );

      if (bookingRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingRes.rows[0];

      // Validate booking ownership unless staff/admin
      if (booking.user_id !== req.user?.dbUserId && req.user?.dbRole === 'PASSENGER') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'You do not have permission to cancel this ticket' });
      }

      if (booking.booking_status === 'CANCELLED') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'This ticket is already cancelled' });
      }

      // 2. Calculate refund via PostgreSQL stored function
      const refundRes = await client.query(
        'SELECT calculate_refund($1, $2) AS refund',
        [booking.fare, booking.journey_date]
      );
      const refundAmount = parseFloat(refundRes.rows[0].refund);

      // 3. Update booking status
      await client.query(
        "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = $1",
        [bookingId]
      );

      // 4. Release seat
      await client.query(
        'UPDATE seats SET is_booked = false, booked_by_user_id = NULL, booking_id = NULL WHERE booking_id = $1',
        [bookingId]
      );

      // 5. Update payment & refund records
      const paymentUpdate = await client.query(
        `UPDATE payments 
         SET refund_status = 'COMPLETED', refund_amount = $1, refund_date = CURRENT_TIMESTAMP
         WHERE booking_id = $2 RETURNING *`,
        [refundAmount, bookingId]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Booking cancelled successfully. Refund initiated.',
        bookingId,
        refundAmount,
        cancellationFee: parseFloat(booking.fare) - refundAmount,
        payment: paymentUpdate.rows[0] || null,
      });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('Cancellation transaction error:', err);
      res.status(500).json({ error: 'Failed to cancel booking: ' + err.message });
    } finally {
      client.release();
    }
  });

  // Get user's bookings
  app.get('/api/bookings/my', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT b.*, t.train_name, t.train_number, t.source, t.destination, t.departure_time, t.arrival_time,
                p.payment_status, p.refund_status, p.refund_amount, p.transaction_reference
         FROM bookings b
         JOIN trains t ON b.train_id = t.id
         LEFT JOIN payments p ON b.id = p.booking_id
         WHERE b.user_id = $1
         ORDER BY b.booking_time DESC`,
        [req.user?.dbUserId]
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching user bookings:', err);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  // Get specific booking / PNR
  app.get('/api/bookings/pnr/:pnr', async (req: Request, res: Response) => {
    try {
      const { pnr } = req.params;
      const result = await pool.query(
        `SELECT b.*, t.train_name, t.train_number, t.source, t.destination, t.departure_time, t.arrival_time,
                p.payment_status, p.refund_status, p.refund_amount, p.transaction_reference
         FROM bookings b
         JOIN trains t ON b.train_id = t.id
         LEFT JOIN payments p ON b.id = p.booking_id
         WHERE b.pnr = $1`,
        [pnr.toUpperCase()]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'PNR not found' });
      }
      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error querying PNR:', err);
      res.status(500).json({ error: 'Failed to fetch PNR' });
    }
  });

  // ----------------------------------------------------
  // 6. COMPLAINTS APIS (PASSENGER + STAFF + ADMIN)
  // ----------------------------------------------------
  app.post('/api/complaints', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId, category, description, priority } = req.body;
      if (!category || !description) {
        return res.status(400).json({ error: 'Category and description are required' });
      }

      const result = await pool.query(
        `INSERT INTO complaints (user_id, booking_id, category, description, priority, status)
         VALUES ($1, $2, $3, $4, COALESCE($5, 'MEDIUM'), 'OPEN')
         RETURNING *`,
        [req.user?.dbUserId, bookingId || null, category, description, priority]
      );

      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      console.error('Error creating complaint:', err);
      res.status(500).json({ error: 'Failed to lodge complaint' });
    }
  });

  app.get('/api/complaints', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      let query = `
        SELECT c.*, u.name as user_name, u.email as user_email, b.pnr
        FROM complaints c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN bookings b ON c.booking_id = b.id
      `;
      const params: any[] = [];

      // Passengers only see their own complaints; Staff/Admin see all
      if (req.user?.dbRole === 'PASSENGER') {
        params.push(req.user.dbUserId);
        query += ' WHERE c.user_id = $1';
      }

      query += ' ORDER BY c.created_at DESC';
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching complaints:', err);
      res.status(500).json({ error: 'Failed to fetch complaints' });
    }
  });

  app.put('/api/complaints/:id/status', requireAuth, requireRole(['STAFF', 'ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
      const complaintId = parseInt(req.params.id, 10);
      const { status, assignedStaff, resolutionNotes } = req.body;

      const result = await pool.query(
        `UPDATE complaints 
         SET status = COALESCE($1, status),
             assigned_staff = COALESCE($2, assigned_staff),
             resolution_notes = COALESCE($3, resolution_notes),
             resolved_at = CASE WHEN $1 = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE resolved_at END
         WHERE id = $4
         RETURNING *`,
        [status, assignedStaff, resolutionNotes, complaintId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Complaint not found' });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      console.error('Error updating complaint status:', err);
      res.status(500).json({ error: 'Failed to update complaint' });
    }
  });

  // ----------------------------------------------------
  // 7. FEEDBACK & SENTIMENT APIS
  // ----------------------------------------------------
  app.post('/api/feedback', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const { bookingId, rating, comment } = req.body;
      if (!rating || !comment) {
        return res.status(400).json({ error: 'Rating and comment are required' });
      }

      // Run ML Sentiment Analysis
      const nlp = analyzeSentiment(comment);

      const result = await pool.query(
        `INSERT INTO feedback (user_id, booking_id, rating, comment, sentiment, sentiment_confidence)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.user?.dbUserId, bookingId || null, rating, comment, nlp.sentiment, nlp.sentimentConfidence]
      );

      res.status(201).json({
        ...result.rows[0],
        mlAnalysis: nlp,
      });
    } catch (err: any) {
      console.error('Error saving feedback:', err);
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  app.get('/api/feedback', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT f.*, u.name as user_name
         FROM feedback f
         JOIN users u ON f.user_id = u.id
         ORDER BY f.created_at DESC LIMIT 50`
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching feedback:', err);
      res.status(500).json({ error: 'Failed to fetch feedback' });
    }
  });

  // ----------------------------------------------------
  // 8. ML PREDICTION ENDPOINTS
  // ----------------------------------------------------
  app.post('/api/ml/waitlist-prediction', (req: Request, res: Response) => {
    try {
      const { trainNumber, journeyDate, travelClass, currentWaitlist, totalSeats } = req.body;
      const prediction = predictWaitlistConfirmation({
        trainNumber: trainNumber || '12951',
        journeyDate: journeyDate || '2026-09-28',
        travelClass: travelClass || '3A',
        currentWaitlist: currentWaitlist || 12,
        totalSeats: totalSeats || 120,
      });
      res.json(prediction);
    } catch (err: any) {
      res.status(500).json({ error: 'ML waitlist prediction failed' });
    }
  });

  app.post('/api/ml/sentiment', (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text prompt required for sentiment evaluation' });
      }
      const result = analyzeSentiment(text);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Sentiment analysis failed' });
    }
  });

  // ----------------------------------------------------
  // MULTILINGUAL AI VOICE & TEXT CHATBOT ENDPOINT
  // ----------------------------------------------------
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, language } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message query is required' });
      }

      const hasValidKey =
        process.env.GEMINI_API_KEY &&
        process.env.GEMINI_API_KEY.trim() !== '' &&
        process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

      if (hasValidKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI generation timeout')), 3500)
          );

          const aiPromise = ai.models.generateContent({
  // Current smallest stable model; 2.5 Flash-Lite is restricted for new projects.
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  contents: message,
  config: {
    systemInstruction: `You are SmartRail AI, an intelligent multilingual assistant for Indian Railways.
You answer user questions about train timings, seat & sleeper berth availability, PNR confirmation rules, luggage limits, tatkal booking rules, platform details, ticket cancellations, and catering.
CRITICAL INSTRUCTION: Always respond in the EXACT same language that the user asked in. If the user asks in Marathi (मराठी), answer in fluent Marathi. If in Hindi (हिन्दी), answer in fluent Hindi. If in English, answer in English. If in any other language, answer in that language.
Keep responses concise, helpful, polite, and well-structured with bullet points where appropriate. Maximum 3 short paragraphs.`,
  },
});

          const response = await Promise.race([aiPromise, timeoutPromise]);
          if (response && response.text) {
            return res.json({ reply: response.text });
          }
        } catch (aiErr: any) {
          console.warn('Gemini API call, using instant local intelligence:', aiErr.message);
        }
      }

      // Intelligent local multilingual fallback
      const lower = message.toLowerCase();
      let reply = '';
      if (lower.includes('pnr') || lower.includes('पीएनआर')) {
        reply = language === 'mr'
          ? 'पीएनआर (PNR) स्थिती तपासण्यासाठी तुमच्या १०-अंकी पीएनआर क्रमांकाचा वापर करा. तुम्ही "माझा प्रवास" टॅबमध्ये किंवा मुख्य शोध पट्टीमध्ये पीएनआर टाकून तत्काळ आरक्षण स्थिती, कोच आणि सीट क्रमांक पाहू शकता.'
          : language === 'hi'
          ? 'पीएनआर (PNR) स्थिति जांचने के लिए अपने 10-अंकों के पीएनआर का उपयोग करें। आप "मेरी यात्राएं" टैब में जाकर अपनी तत्काल सीट स्थिति, कोच और आरक्षण विवरण देख सकते हैं।'
          : 'To check your PNR status, enter your 10-digit PNR in the "My Journeys" section. It gives you instant real-time coach, berth/seat number, and confirmation details.';
      } else if (lower.includes('refund') || lower.includes('cancel') || lower.includes('रद्द') || lower.includes('परतावा') || lower.includes('रिफंड')) {
        reply = language === 'mr'
          ? 'रेल्वे तिकीट रद्द करण्याचे नियम:\n• प्रवासाच्या ३ दिवस आधी रद्द केल्यास: फक्त रु. १०० लिपिक शुल्क.\n• १ ते २ दिवस आधी: २५% शुल्क.\n• प्रवासाच्या २४ तासांच्या आत: ५०% शुल्क.\nपरतावा थेट तुमच्या बँक खात्यात/युपीआयवर तत्काळ जमा होतो.'
          : language === 'hi'
          ? 'रेलवे टिकट रद्दीकरण नियम:\n• यात्रा से 3 दिन पहले: केवल ₹100 क्लर्क शुल्क कटेगा।\n• 1 से 2 दिन पहले: 25% रद्दीकरण शुल्क।\n• 24 घंटे के भीतर: 50% शुल्क।\nरिफंड तुरंत आपके उसी बैंक खाते/यूपीआई में भेज दिया जाता है।'
          : 'Ticket Cancellation & Refund Rules:\n• 3+ days before journey: Flat ₹100 clerkage fee deducted.\n• 1 to 2 days before: 25% cancellation fee.\n• Within 24 hours: 50% cancellation fee.\nRefunds are processed automatically via ACID transaction to your original payment method.';
      } else if (lower.includes('delhi') || lower.includes('mumbai') || lower.includes('मुंबई') || lower.includes('दिल्ली')) {
        reply = language === 'mr'
          ? 'मुंबई आणि दिल्ली दरम्यान धावणाऱ्या प्रमुख गाड्या:\n1. 12951 मुंबई राजधानी एक्सप्रेस (17:00 सुटते)\n2. 12953 ऑगस्ट क्रांती तेजस राजधानी (17:10 सुटते)\n3. 22221 मुंबई सीएसएमटी राजधानी (16:00 सुटते)\nतुम्ही वरील सर्च बॉक्समध्ये शोधून थेट जागा बुक करू शकता.'
          : language === 'hi'
          ? 'मुंबई और दिल्ली के बीच चलने वाली प्रमुख रेलगाड़ियाँ:\n1. 12951 मुंबई राजधानी एक्सप्रेस (17:00 प्रस्थान)\n2. 12953 अगस्त क्रांति तेजस राजधानी (17:10 प्रस्थान)\n3. 22221 मुंबई सीएसएमटी राजधानी (16:00 प्रस्थान)\nआप ऊपर दिए गए सर्च फॉर्म से तुरंत टिकट बुक कर सकते हैं।'
          : 'Premier trains running between Mumbai and Delhi include:\n1. 12951 Mumbai Rajdhani Express (Departs 17:00)\n2. 12953 August Kranti Tejas Rajdhani (Departs 17:10)\n3. 22221 Mumbai CSMT Rajdhani Express (Departs 16:00)\nYou can select and book available berths directly on the Search & Book tab.';
      } else {
        reply = language === 'mr'
          ? `स्मार्टरेल्वे सहाय्यक: मी तुम्हाला ट्रेन शोधणे, सीट/बर्थ निवडणे, युपीआय द्वारे पेमेंट करणे, पीएनआर तपासणे आणि थेट ट्रॅकिंग पाहण्यासाठी मदत करू शकतो. तुम्ही मला मराठी, हिंदी किंवा इंग्रजीत प्रश्न विचारू शकता!`
          : language === 'hi'
          ? `स्मार्टरेल एआई सहायक: मैं आपकी ट्रेन खोज, सीट/बर्थ आरक्षण, यूपीआई भुगतान, पीएनआर स्थिति और लाइव जीआईएस ट्रैकिंग में सहायता कर सकता हूँ। आप हिंदी, मराठी या अंग्रेजी में कोई भी सवाल पूछ सकते हैं!`
          : `SmartRail AI: I can help you with train schedules, live seat & sleeper berth bookings, UPI QR payments, live GPS tracking, and grievance redressal. Feel free to ask questions by typing or speaking in English, Hindi, or Marathi!`;
      }

      res.json({ reply });
    } catch (err: any) {
      console.error('AI chat endpoint error:', err);
      res.status(500).json({ error: 'Failed to generate assistant response' });
    }
  });

  // ----------------------------------------------------
  // 9. LIVE & SIMULATED TRAIN TRACKING APIS
  // ----------------------------------------------------
  app.get('/api/trains/:id/location', async (req: Request, res: Response) => {
    try {
      const trainId = parseInt(req.params.id, 10);
      const trainRes = await pool.query('SELECT * FROM trains WHERE id = $1', [trainId]);
      if (trainRes.rows.length === 0) {
        return res.status(404).json({ error: 'Train not found' });
      }
      const t = trainRes.rows[0];
      const tracking = await getRailRadarTracking(
        t.train_number,
        t.train_name,
        t.source,
        t.destination,
        t.speed_kmph,
        t.delay_minutes
      );
      res.json(tracking);
    } catch (err: any) {
      console.error('Error retrieving train tracking data:', err);
      res.status(500).json({ error: 'Failed to retrieve train location' });
    }
  });

  app.get('/api/tracking/active', async (_req: Request, res: Response) => {
    try {
      const trainsRes = await pool.query('SELECT * FROM trains LIMIT 10');
      const activeTracking = await Promise.all(trainsRes.rows.map((t: any) =>
        getRailRadarTracking(
          t.train_number,
          t.train_name,
          t.source,
          t.destination,
          t.speed_kmph,
          t.delay_minutes
        )
      ));
      res.json(activeTracking);
    } catch (err: any) {
      console.error('Error fetching active trains tracking:', err);
      res.status(500).json({ error: 'Failed to fetch active tracking' });
    }
  });

  // Proxy weather requests so the OpenWeather key never reaches the browser.
  app.get('/api/weather', async (req: Request, res: Response) => {
    const lat = Number(req.query.lat); const lon = Number(req.query.lon);
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey || !Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(204).end();
    try {
      const weather = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`, { signal: AbortSignal.timeout(8_000) });
      if (!weather.ok) return res.status(weather.status).json({ error: 'Weather service unavailable' });
      const data: any = await weather.json();
      res.json({ temperature: Math.round(data.main?.temp), description: data.weather?.[0]?.description || 'Unknown', windKmph: Math.round((data.wind?.speed || 0) * 3.6) });
    } catch { res.status(502).json({ error: 'Weather service unavailable' }); }
  });

  // ----------------------------------------------------
  // 10. ADVANCED ANALYTICS (USING DATABASE VIEWS)
  // ----------------------------------------------------
  app.get('/api/analytics/overview', async (_req: Request, res: Response) => {
    try {
      const [
        passengersRes,
        bookingsRes,
        activeTrainsRes,
        revenueRes,
        cancellationsRes,
        complaintsRes,
        feedbackRes,
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users WHERE role = $1', ['PASSENGER']),
        pool.query('SELECT COUNT(*) as count FROM bookings'),
        pool.query("SELECT COUNT(*) as count FROM trains WHERE train_status <> 'CANCELLED'"),
        pool.query("SELECT COALESCE(SUM(amount - COALESCE(refund_amount, 0)), 0) as net_revenue FROM payments WHERE payment_status = 'SUCCESS'"),
        pool.query("SELECT COUNT(*) as count FROM bookings WHERE booking_status = 'CANCELLED'"),
        pool.query("SELECT COUNT(*) as count FROM complaints WHERE status = 'OPEN'"),
        pool.query('SELECT ROUND(AVG(rating), 2) as avg_rating FROM feedback'),
      ]);

      res.json({
        totalPassengers: parseInt(passengersRes.rows[0].count, 10),
        totalBookings: parseInt(bookingsRes.rows[0].count, 10),
        activeTrains: parseInt(activeTrainsRes.rows[0].count, 10),
        netRevenue: parseFloat(revenueRes.rows[0].net_revenue),
        cancellations: parseInt(cancellationsRes.rows[0].count, 10),
        openComplaints: parseInt(complaintsRes.rows[0].count, 10),
        avgRating: parseFloat(feedbackRes.rows[0].avg_rating || '4.2'),
      });
    } catch (err: any) {
      console.error('Error calculating overview analytics:', err);
      res.status(500).json({ error: 'Failed to retrieve overview metrics' });
    }
  });

  app.get('/api/analytics/views/train-performance', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM TrainPerformance ORDER BY total_revenue DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch TrainPerformance view' });
    }
  });

  app.get('/api/analytics/views/feedback-sentiments', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM FeedbackAnalytics');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch FeedbackAnalytics view' });
    }
  });

  app.get('/api/analytics/views/complaints', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query('SELECT * FROM ComplaintAnalytics ORDER BY total_complaints DESC');
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch ComplaintAnalytics view' });
    }
  });

  // ----------------------------------------------------
  // 11. AUDIT LOGS (ADMIN ONLY)
  // ----------------------------------------------------
  app.get('/api/admin/audit-logs', requireAuth, requireRole(['ADMIN']), async (_req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT a.*, u.email as user_email, u.name as user_name
         FROM audit_logs a
         LEFT JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC
         LIMIT 100`
      );
      res.json(result.rows);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  });

  // ----------------------------------------------------
  // 12. DBMS LAB / VIVA DEMONSTRATION API
  // ----------------------------------------------------
  app.get('/api/dbms/schema-inspect', async (_req: Request, res: Response) => {
    try {
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);
      const views = await pool.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      const indexes = await pool.query(`
        SELECT tablename, indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `);
      const triggers = await pool.query(`
        SELECT event_object_table as table_name, trigger_name, action_timing, event_manipulation 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
        ORDER BY event_object_table, trigger_name;
      `);

      res.json({
        tables: tables.rows.map((r: any) => r.table_name),
        views: views.rows.map((r: any) => r.table_name),
        indexes: indexes.rows,
        triggers: triggers.rows,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to inspect DBMS schema' });
    }
  });

  if (serveFrontend) {
    // Mount Vite only for local development. Vercel serves the built SPA and
    // invokes the API as a serverless function instead.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  return app;
}

async function startServer() {
  const app = await createApp(true);
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚂 SMART RAILWAY Server running at http://0.0.0.0:${PORT}`);
  });
}

// Vercel imports createApp from its function entry point. Do not create a
// listener in that runtime: Vercel owns the HTTP server lifecycle.
if (process.env.VERCEL !== '1') {
  startServer().catch((err) => {
    console.error('Fatal server boot error:', err);
    process.exit(1);
  });
}
