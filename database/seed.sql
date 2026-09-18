-- ============================================================================
-- RailConnect AI Seed Data
-- Sample realistic data for testing DB queries and views
-- ============================================================================

USE railconnect_db;

-- 1. SEED STATIONS
INSERT INTO stations (station_code, station_name, city, state, platform_count) VALUES
('NDLS', 'New Delhi Railway Station', 'New Delhi', 'Delhi', 16),
('CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra', 18),
('HWH', 'Howrah Junction', 'Kolkata', 'West Bengal', 23),
('MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', 12),
('SBC', 'KSR Bengaluru City', 'Bengaluru', 'Karnataka', 10),
('ADI', 'Ahmedabad Junction', 'Ahmedabad', 'Gujarat', 12)
ON DUPLICATE KEY UPDATE station_name=VALUES(station_name);

-- 2. SEED TRAINS
INSERT INTO trains (train_number, train_name, train_type, total_coaches, is_active) VALUES
('22436', 'Vande Bharat Express', 'Vande Bharat', 16, TRUE),
('12952', 'Mumbai Rajdhani Express', 'Rajdhani', 20, TRUE),
('12002', 'Bhopal Shatabdi Express', 'Shatabdi', 14, TRUE),
('12626', 'Kerala Superfast Express', 'Superfast Express', 24, TRUE)
ON DUPLICATE KEY UPDATE train_name=VALUES(train_name);

-- 3. SEED SCHEDULES
INSERT INTO schedules (schedule_id, train_number, source_station_code, destination_station_code, departure_time, arrival_time, distance_km, total_seats_ac, total_seats_sleeper, fare_ac, fare_sleeper, running_days) VALUES
(1, '22436', 'NDLS', 'CSMT', '06:00:00', '14:30:00', 1384, 180, 0, 2450.00, 0.00, 'Mon,Wed,Thu,Fri,Sat,Sun'),
(2, '12952', 'NDLS', 'CSMT', '16:55:00', '08:35:00', 1384, 250, 0, 2900.00, 0.00, 'Daily'),
(3, '12626', 'NDLS', 'SBC', '20:10:00', '14:20:00', 2398, 120, 450, 2800.00, 780.00, 'Daily')
ON DUPLICATE KEY UPDATE train_number=VALUES(train_number);

-- 4. SEED SAMPLE USERS
INSERT INTO users (user_id, full_name, email, password_hash, phone, role) VALUES
(1, 'Admin User', 'admin@railconnect.ai', 'scrypt$railconnect-admin-seed$b617573b212530b22272437cccd0c52e6f16c545dad23781f8441023c093aacbe39948fa13b9661c743f9bbd2ce6d171cdfc5accdf33bd94f6afad18714d82c1', '9999999999', 'admin'),
(2, 'Rahul Sharma', 'rahul@example.com', 'scrypt$railconnect-passenger-seed$ef548bfce93c9c67671feb4f1ed0396aec5e80358c171b2051b965c024f4d66a6662824105c01a10cab091192a2c48fa953db6614546b383320dd066bf49126d', '9876543210', 'passenger'),
(3, 'Priya Patel', 'priya@example.com', 'scrypt$railconnect-passenger-seed$ef548bfce93c9c67671feb4f1ed0396aec5e80358c171b2051b965c024f4d66a6662824105c01a10cab091192a2c48fa953db6614546b383320dd066bf49126d', '9876543211', 'passenger')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash), phone=VALUES(phone), role=VALUES(role);

-- 5. SEED BOOKINGS
INSERT INTO bookings (booking_id, pnr_number, user_id, schedule_id, journey_date, class_type, passenger_count, total_fare, booking_status) VALUES
(1, '8429104821', 2, 1, '2026-10-15', 'CC', 2, 4900.00, 'CONFIRMED'),
(2, '9123847120', 3, 2, '2026-10-18', '2A', 1, 2900.00, 'WAITLIST')
ON DUPLICATE KEY UPDATE pnr_number=VALUES(pnr_number);
