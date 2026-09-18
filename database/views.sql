-- ============================================================================
-- RailConnect AI Database Views
-- Useful database views for analytical and display queries
-- ============================================================================

USE railconnect_db;

-- 1. VIEW: Active Train Schedule Overview
CREATE OR REPLACE VIEW view_train_schedules AS
SELECT 
    s.schedule_id,
    t.train_number,
    t.train_name,
    t.train_type,
    src.station_name AS source_station,
    src.city AS source_city,
    dest.station_name AS destination_station,
    dest.city AS destination_city,
    s.departure_time,
    s.arrival_time,
    s.distance_km,
    s.fare_ac,
    s.fare_sleeper,
    s.running_days
FROM schedules s
JOIN trains t ON s.train_number = t.train_number
JOIN stations src ON s.source_station_code = src.station_code
JOIN stations dest ON s.destination_station_code = dest.station_code
WHERE t.is_active = TRUE;

-- 2. VIEW: Booking Summary Details
CREATE OR REPLACE VIEW view_booking_details AS
SELECT 
    b.booking_id,
    b.pnr_number,
    u.full_name AS passenger_name,
    u.email AS passenger_email,
    u.phone AS passenger_phone,
    t.train_number,
    t.train_name,
    b.journey_date,
    b.class_type,
    b.passenger_count,
    b.total_fare,
    b.booking_status,
    b.booked_at
FROM bookings b
JOIN users u ON b.user_id = u.user_id
JOIN schedules s ON b.schedule_id = s.schedule_id
JOIN trains t ON s.train_number = t.train_number;
