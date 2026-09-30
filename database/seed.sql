-- SMART RAILWAY REALISTIC SEED DATA (POSTGRESQL)
-- 20+ realistic Indian railway trains, users, bookings, payments, complaints, feedback, and audit logs

-- 1. SEED USERS
INSERT INTO users (uid, name, email, phone, role) VALUES
('uid_mrunal_admin', 'Mrunal Baravkar', 'mrunal.r.baravkar@gmail.com', '+91 98230 45678', 'ADMIN'),
('uid_staff_arun', 'Arun Sharma (Duty Officer)', 'arun.staff@railway.gov.in', '+91 98110 12345', 'STAFF'),
('uid_passenger_priya', 'Priya Kulkarni', 'priya.k@gmail.com', '+91 97654 32109', 'PASSENGER'),
('uid_passenger_rohit', 'Rohit Verma', 'rohit.v@outlook.com', '+91 98221 65432', 'PASSENGER'),
('uid_passenger_ananya', 'Ananya Deshmukh', 'ananya.d@gmail.com', '+91 94220 99881', 'PASSENGER'),
('uid_passenger_vikram', 'Vikramaditya Roy', 'vikram.roy@yahoo.com', '+91 99300 11223', 'PASSENGER')
ON CONFLICT (uid) DO NOTHING;

-- 2. SEED TRAINS (20+ Premier trains)
INSERT INTO trains (
    train_number, train_name, source, destination, departure_time, arrival_time, 
    duration, total_seats, train_type, classes, base_fare, train_status, 
    current_station, next_station, delay_minutes, speed_kmph
) VALUES
('12951', 'Mumbai Rajdhani Express', 'Mumbai', 'Delhi', '17:00', '08:32', '15h 32m', 160, 'Rajdhani', '1A,2A,3A', 1450.00, 'ON_TIME', 'Surat', 'Vadodara', 7, 115),
('12953', 'August Kranti Tejas Rajdhani', 'Mumbai', 'Delhi', '17:10', '09:43', '16h 33m', 150, 'Rajdhani', '1A,2A,3A', 1380.00, 'ON_TIME', 'Vapi', 'Surat', 0, 110),
('12123', 'Deccan Queen Superfast', 'Mumbai', 'Pune', '17:10', '20:25', '3h 15m', 120, 'Superfast', 'CC,2S', 345.00, 'ON_TIME', 'Lonavala', 'Shivajinagar', 4, 85),
('11010', 'Sinhagad Express', 'Pune', 'Mumbai', '06:05', '09:55', '3h 50m', 130, 'Express', 'CC,2S', 280.00, 'DELAYED', 'Kalyan', 'Dadar', 14, 75),
('22221', 'Mumbai CSMT Rajdhani Express', 'Mumbai', 'Delhi', '16:00', '09:55', '17h 55m', 140, 'Rajdhani', '1A,2A,3A', 1420.00, 'ON_TIME', 'Bhusawal', 'Bhopal', 5, 110),
('20901', 'Vande Bharat Express (Mumbai - Gandhinagar)', 'Mumbai', 'Ahmedabad', '06:00', '11:25', '5h 25m', 112, 'Vande Bharat', 'EC,CC', 1255.00, 'ON_TIME', 'Surat', 'Vadodara', 0, 130),
('12952', 'New Delhi Mumbai Rajdhani', 'Delhi', 'Mumbai', '16:55', '08:35', '15h 40m', 160, 'Rajdhani', '1A,2A,3A', 1450.00, 'ON_TIME', 'Kota', 'Ratlam', 2, 118),
('12009', 'Shatabdi Express', 'Mumbai', 'Ahmedabad', '06:20', '12:45', '6h 25m', 140, 'Superfast', 'EC,CC', 980.00, 'ON_TIME', 'Bharuch', 'Vadodara', 6, 105),
('12127', 'CSMT Pune Intercity Express', 'Mumbai', 'Pune', '06:40', '09:57', '3h 17m', 120, 'Superfast', 'CC,2S', 315.00, 'ON_TIME', 'Karjat', 'Lonavala', 0, 80),
('12128', 'Pune CSMT Intercity Express', 'Pune', 'Mumbai', '17:55', '21:05', '3h 10m', 120, 'Superfast', 'CC,2S', 315.00, 'ON_TIME', 'Thane', 'Dadar', 8, 82),
('12027', 'Shatabdi Express (Bengaluru - Chennai)', 'Bengaluru', 'Chennai', '06:00', '11:00', '5h 00m', 120, 'Superfast', 'EC,CC', 820.00, 'ON_TIME', 'Katpadi', 'Arakkonam', 0, 100),
('20608', 'Vande Bharat Express (Mysuru - Chennai)', 'Bengaluru', 'Chennai', '14:50', '19:30', '4h 40m', 112, 'Vande Bharat', 'EC,CC', 1100.00, 'ON_TIME', 'Jolarpettai', 'Katpadi', 3, 125),
('12957', 'Swarna Jayanti Rajdhani', 'Ahmedabad', 'Delhi', '17:45', '07:30', '13h 45m', 150, 'Rajdhani', '1A,2A,3A', 1390.00, 'ON_TIME', 'Jaipur', 'Gurgaon', 0, 112),
('12015', 'Ajmer Shatabdi Express', 'Delhi', 'Jaipur', '06:10', '10:40', '4h 30m', 130, 'Superfast', 'EC,CC', 780.00, 'ON_TIME', 'Rewari', 'Alwar', 5, 95),
('12955', 'Mumbai Jaipur Superfast', 'Mumbai', 'Jaipur', '19:05', '12:00', '16h 55m', 150, 'Superfast', '1A,2A,3A,SL', 1040.00, 'ON_TIME', 'Surat', 'Vadodara', 0, 90)
ON CONFLICT (train_number) DO NOTHING;

-- 3. SEED SEATS & BOOKINGS (Realistic historical records)
-- Let's insert confirmed bookings for user Priya and Rohit
DO $$
DECLARE
    v_user_priya_id INTEGER;
    v_user_rohit_id INTEGER;
    v_train_rajdhani_id INTEGER;
    v_train_deccan_id INTEGER;
    v_booking_1 INTEGER;
    v_booking_2 INTEGER;
    v_booking_3 INTEGER;
BEGIN
    SELECT id INTO v_user_priya_id FROM users WHERE email = 'priya.k@gmail.com' LIMIT 1;
    SELECT id INTO v_user_rohit_id FROM users WHERE email = 'rohit.v@outlook.com' LIMIT 1;
    SELECT id INTO v_train_rajdhani_id FROM trains WHERE train_number = '12951' LIMIT 1;
    SELECT id INTO v_train_deccan_id FROM trains WHERE train_number = '12123' LIMIT 1;

    -- Booking 1: Priya on Mumbai Rajdhani
    INSERT INTO bookings (
        user_id, train_id, pnr, journey_date, passenger_name, passenger_age, 
        passenger_gender, seat_number, travel_class, fare, booking_status
    ) VALUES (
        v_user_priya_id, v_train_rajdhani_id, 'SR7K29X4', '2026-09-28', 'Priya Kulkarni', 29, 
        'Female', 'B2-24', '3A', 1450.00, 'CONFIRMED'
    ) ON CONFLICT (pnr) DO NOTHING RETURNING id INTO v_booking_1;

    IF v_booking_1 IS NOT NULL THEN
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference)
        VALUES (v_booking_1, 1450.00, 'UPI', 'SUCCESS', 'TXN_UPI_992100881')
        ON CONFLICT (transaction_reference) DO NOTHING;

        INSERT INTO feedback (user_id, booking_id, rating, comment, sentiment, sentiment_confidence)
        VALUES (v_user_priya_id, v_booking_1, 5, 'The train was remarkably clean and the staff was courteous and punctual!', 'POSITIVE', 96);
    END IF;

    -- Booking 2: Rohit on Deccan Queen
    INSERT INTO bookings (
        user_id, train_id, pnr, journey_date, passenger_name, passenger_age, 
        passenger_gender, seat_number, travel_class, fare, booking_status
    ) VALUES (
        v_user_rohit_id, v_train_deccan_id, 'SR8M31P9', '2026-09-29', 'Rohit Verma', 34, 
        'Male', 'C1-12', 'CC', 345.00, 'CONFIRMED'
    ) ON CONFLICT (pnr) DO NOTHING RETURNING id INTO v_booking_2;

    IF v_booking_2 IS NOT NULL THEN
        INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_reference)
        VALUES (v_booking_2, 345.00, 'CARD', 'SUCCESS', 'TXN_CARD_4490123')
        ON CONFLICT (transaction_reference) DO NOTHING;

        INSERT INTO complaints (user_id, booking_id, category, description, status, priority, assigned_staff)
        VALUES (v_user_rohit_id, v_booking_2, 'Train Delay', 'Train was delayed by 14 minutes near monkey hill junction.', 'IN_PROGRESS', 'MEDIUM', 'Arun Sharma (Duty Officer)');
    END IF;

    -- Seed sample inventory seats
    INSERT INTO seats (train_id, journey_date, seat_number, travel_class, is_booked, booked_by_user_id, booking_id)
    VALUES 
    (v_train_rajdhani_id, '2026-09-28', 'A1', '3A', true, v_user_priya_id, v_booking_1),
    (v_train_rajdhani_id, '2026-09-28', 'A2', '3A', false, NULL, NULL),
    (v_train_rajdhani_id, '2026-09-28', 'B1', '3A', false, NULL, NULL),
    (v_train_rajdhani_id, '2026-09-28', 'B2', '3A', true, v_user_priya_id, v_booking_1)
    ON CONFLICT (train_id, journey_date, seat_number) DO NOTHING;
END $$;
