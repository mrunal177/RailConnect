const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');
const { generatePnr } = require('../utils/security');

// Person 2 module: inventory, seat allocation, waitlist prediction, and booking transactions.

const bookingSummaryQuery = `
  SELECT b.booking_id AS bookingId, b.user_id AS userId, b.pnr_number AS pnr, b.journey_date AS journeyDate, b.class_type AS classType,
         b.passenger_count AS passengerCount, b.total_fare AS totalFare, b.booking_status AS status, b.booked_at AS bookingDate,
         t.train_number AS trainNumber, t.train_name AS trainName, src.station_name AS source, dest.station_name AS destination,
         s.departure_time AS departureTime, s.arrival_time AS arrivalTime
  FROM bookings b JOIN schedules s ON s.schedule_id = b.schedule_id JOIN trains t ON t.train_number = s.train_number
  JOIN stations src ON src.station_code = s.source_station_code JOIN stations dest ON dest.station_code = s.destination_station_code`;

const validatePassengers = (passengers) => {
  if (!Array.isArray(passengers) || passengers.length === 0 || passengers.length > 6) throw createError(400, 'Provide between 1 and 6 passengers');
  passengers.forEach((passenger, index) => {
    if (!passenger.name || String(passenger.name).trim().length < 2) throw createError(400, `Passenger ${index + 1} needs a valid name`);
    if (!Number.isInteger(Number(passenger.age)) || Number(passenger.age) < 1 || Number(passenger.age) > 120) throw createError(400, `Passenger ${index + 1} needs a valid age`);
    if (!['Male', 'Female', 'Other'].includes(passenger.gender)) throw createError(400, `Passenger ${index + 1} needs a valid gender`);
  });
};

const formatBooking = async (booking) => {
  const [passengers] = await pool.execute(
    `SELECT passenger_name AS name, passenger_age AS age, passenger_gender AS gender, coach_number AS coach,
            seat_number AS seat, ticket_status AS status FROM tickets WHERE booking_id = ? ORDER BY ticket_id`, [booking.bookingId]
  );
  return { ...booking, totalFare: Number(booking.totalFare), passengers };
};

const createBooking = async (req, res, next) => {
  let connection;
  try {
    requireFields(req.body, ['scheduleId', 'journeyDate', 'classType', 'passengers']);
    const { scheduleId, journeyDate, classType, passengers } = req.body;
    if (!['CC', 'SL'].includes(classType)) throw createError(400, 'Selected travel class is not available');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journeyDate) || new Date(`${journeyDate}T00:00:00`) < new Date(new Date().toDateString())) throw createError(400, 'Journey date must be today or later');
    validatePassengers(passengers);

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [schedules] = await connection.execute(
      `SELECT s.* FROM schedules s JOIN trains t ON t.train_number = s.train_number
       WHERE s.schedule_id = ? AND t.is_active = TRUE FOR UPDATE`, [scheduleId]
    );
    const schedule = schedules[0];
    if (!schedule) throw createError(404, 'Selected schedule is unavailable');
    const capacity = classType === 'SL' ? Number(schedule.total_seats_sleeper) : Number(schedule.total_seats_ac);
    const fare = classType === 'SL' ? Number(schedule.fare_sleeper) : Number(schedule.fare_ac);
    if (capacity <= 0 || fare <= 0) throw createError(400, 'Selected class is unavailable for this schedule');
    const [seatRows] = await connection.execute(
      `SELECT COUNT(t.ticket_id) AS usedSeats FROM bookings b JOIN tickets t ON t.booking_id = b.booking_id
       WHERE b.schedule_id = ? AND b.journey_date = ? AND b.class_type = ?
         AND b.booking_status = 'CONFIRMED' AND t.ticket_status = 'CONFIRMED'`, [scheduleId, journeyDate, classType]
    );
    const usedSeats = Number(seatRows[0].usedSeats);
    const confirmed = usedSeats + passengers.length <= capacity;
    const status = confirmed ? 'CONFIRMED' : 'WAITLIST';
    const totalFare = fare * passengers.length;
    let pnr;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      pnr = generatePnr();
      const [existing] = await connection.execute('SELECT booking_id FROM bookings WHERE pnr_number = ?', [pnr]);
      if (!existing.length) break;
      pnr = null;
    }
    if (!pnr) throw createError(500, 'Could not generate a unique PNR');
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings (pnr_number, user_id, schedule_id, journey_date, class_type, passenger_count, total_fare, booking_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [pnr, req.user.id, scheduleId, journeyDate, classType, passengers.length, totalFare, status]
    );
    const bookingId = bookingResult.insertId;
    for (let index = 0; index < passengers.length; index += 1) {
      const passenger = passengers[index];
      const seatPosition = usedSeats + index + 1;
      const seatsPerCoach = classType === 'SL' ? 72 : 80;
      const coach = confirmed ? `${classType === 'SL' ? 'S' : 'C'}${Math.ceil(seatPosition / seatsPerCoach)}` : null;
      const seat = confirmed ? String(((seatPosition - 1) % seatsPerCoach) + 1) : `WL ${usedSeats + index + 1 - capacity}`;
      await connection.execute(
        `INSERT INTO tickets (booking_id, passenger_name, passenger_age, passenger_gender, coach_number, seat_number, ticket_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [bookingId, passenger.name.trim(), Number(passenger.age), passenger.gender, coach, seat, confirmed ? 'CONFIRMED' : 'WL']
      );
    }
    await connection.commit();
    const [rows] = await pool.execute(`${bookingSummaryQuery} WHERE b.booking_id = ?`, [bookingId]);
    res.status(201).json({ success: true, message: `Booking ${status.toLowerCase()}`, data: await formatBooking(rows[0]) });
  } catch (error) {
    if (connection) await connection.rollback();
    next(error);
  } finally { if (connection) connection.release(); }
};

const getBookingByPNR = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`${bookingSummaryQuery} WHERE b.pnr_number = ?`, [req.params.pnr]);
    if (!rows[0]) throw createError(404, 'Booking not found');
    if (req.user.role !== 'admin' && req.user.id !== rows[0].userId) throw createError(403, 'You are not allowed to view this booking');
    res.json({ success: true, data: await formatBooking(rows[0]) });
  } catch (error) { next(error); }
};

const getUserBookings = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(`${bookingSummaryQuery} WHERE b.user_id = ? ORDER BY b.booked_at DESC`, [req.user.id]);
    res.json({ success: true, data: await Promise.all(rows.map(formatBooking)) });
  } catch (error) { next(error); }
};

module.exports = { createBooking, getBookingByPNR, getUserBookings };
