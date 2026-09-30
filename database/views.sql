-- SMART RAILWAY ANALYTICAL VIEWS
-- For Admin dashboards, passenger travel summaries, and machine learning feature extraction

-- 1. Passenger Booking Summary View
CREATE OR REPLACE VIEW PassengerBookingSummary AS
SELECT 
    u.id AS user_id,
    u.name AS passenger_name,
    u.email,
    COUNT(b.id) AS total_bookings,
    COUNT(CASE WHEN b.booking_status = 'CONFIRMED' THEN 1 END) AS confirmed_bookings,
    COUNT(CASE WHEN b.booking_status = 'CANCELLED' THEN 1 END) AS cancelled_bookings,
    COALESCE(SUM(b.fare), 0) AS total_spend,
    MAX(b.booking_time) AS last_booking_date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.name, u.email;

-- 2. Train Performance View
CREATE OR REPLACE VIEW TrainPerformance AS
SELECT 
    t.id AS train_id,
    t.train_number,
    t.train_name,
    t.source,
    t.destination,
    t.total_seats,
    t.train_status,
    t.delay_minutes,
    COUNT(b.id) AS total_passengers_booked,
    COALESCE(SUM(b.fare), 0) AS total_revenue,
    ROUND(AVG(COALESCE(f.rating, 4.0)), 2) AS average_rating
FROM trains t
LEFT JOIN bookings b ON t.id = b.train_id AND b.booking_status = 'CONFIRMED'
LEFT JOIN feedback f ON b.id = f.booking_id
GROUP BY t.id, t.train_number, t.train_name, t.source, t.destination, t.total_seats, t.train_status, t.delay_minutes;

-- 3. Revenue Summary View
CREATE OR REPLACE VIEW RevenueSummary AS
SELECT 
    TO_CHAR(p.payment_date, 'YYYY-MM-DD') AS payment_day,
    p.payment_method,
    COUNT(p.id) AS total_transactions,
    SUM(p.amount) AS gross_revenue,
    SUM(p.refund_amount) AS total_refunds,
    SUM(p.amount - COALESCE(p.refund_amount, 0)) AS net_revenue
FROM payments p
WHERE p.payment_status = 'SUCCESS'
GROUP BY TO_CHAR(p.payment_date, 'YYYY-MM-DD'), p.payment_method;

-- 4. Complaint Analytics View
CREATE OR REPLACE VIEW ComplaintAnalytics AS
SELECT 
    c.category,
    COUNT(c.id) AS total_complaints,
    COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END) AS open_complaints,
    COUNT(CASE WHEN c.status = 'IN_PROGRESS' THEN 1 END) AS in_progress_complaints,
    COUNT(CASE WHEN c.status = 'RESOLVED' THEN 1 END) AS resolved_complaints,
    ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, CURRENT_TIMESTAMP) - c.created_at)) / 3600)::numeric, 1) AS avg_resolution_hours
FROM complaints c
GROUP BY c.category;

-- 5. Feedback Analytics View
CREATE OR REPLACE VIEW FeedbackAnalytics AS
SELECT 
    f.sentiment,
    COUNT(f.id) AS count,
    ROUND(AVG(f.rating), 2) AS avg_rating,
    ROUND(AVG(f.sentiment_confidence), 1) AS avg_confidence
FROM feedback f
GROUP BY f.sentiment;
