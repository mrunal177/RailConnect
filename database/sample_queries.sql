-- SMART RAILWAY ADVANCED DBMS QUERIES DEMONSTRATION
-- Useful for DBMS Lab Viva, Project Defense, and Analytical Reports

-- 1. INNER JOIN with Aggregation: Most profitable routes
SELECT 
    t.source || ' -> ' || t.destination AS route,
    COUNT(b.id) AS total_confirmed_tickets,
    SUM(b.fare) AS total_revenue,
    ROUND(AVG(b.fare), 2) AS average_ticket_fare
FROM trains t
INNER JOIN bookings b ON t.id = b.train_id
WHERE b.booking_status = 'CONFIRMED'
GROUP BY t.source, t.destination
ORDER BY total_revenue DESC;

-- 2. LEFT JOIN with COALESCE: Trains with or without complaints
SELECT 
    t.train_number,
    t.train_name,
    COUNT(c.id) AS total_complaints,
    COALESCE(COUNT(CASE WHEN c.status = 'OPEN' THEN 1 END), 0) AS unresolved_complaints
FROM trains t
LEFT JOIN bookings b ON t.id = b.train_id
LEFT JOIN complaints c ON b.id = c.booking_id
GROUP BY t.train_number, t.train_name
ORDER BY total_complaints DESC;

-- 3. SUBQUERY & WINDOW FUNCTION: Ranking passengers by spending within each travel class
SELECT 
    u.name,
    u.email,
    b.travel_class,
    b.fare,
    DENSE_RANK() OVER (PARTITION BY b.travel_class ORDER BY b.fare DESC) as class_spending_rank
FROM users u
JOIN bookings b ON u.id = b.user_id
WHERE b.booking_status = 'CONFIRMED';

-- 4. GROUP BY & HAVING: Highly delayed trains with more than 2 complaints
SELECT 
    t.train_number,
    t.train_name,
    t.delay_minutes,
    COUNT(c.id) AS complaint_count
FROM trains t
JOIN bookings b ON t.id = b.train_id
JOIN complaints c ON b.id = c.booking_id
WHERE t.delay_minutes > 15
GROUP BY t.train_number, t.train_name, t.delay_minutes
HAVING COUNT(c.id) >= 2;

-- 5. ACID Transaction Demonstration (Simulation of Seat Booking)
-- BEGIN;
-- SELECT * FROM seats WHERE train_id = 1 AND journey_date = '2026-09-28' AND seat_number = 'A1' FOR UPDATE;
-- INSERT INTO bookings (user_id, train_id, pnr, journey_date, passenger_name, seat_number, travel_class, fare, booking_status)
-- VALUES (1, 1, 'SR998877XX', '2026-09-28', 'Mrunal', 'A1', '3A', 1245.00, 'CONFIRMED');
-- UPDATE seats SET is_booked = true, booked_by_user_id = 1 WHERE train_id = 1 AND journey_date = '2026-09-28' AND seat_number = 'A1';
-- COMMIT;
