-- SMART RAILWAY DATABASE SCHEMA (POSTGRESQL DDL)
-- College DBMS + Full Stack + ML + Cybersecurity Project

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'PASSENGER' CHECK (role IN ('PASSENGER', 'STAFF', 'ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TRAINS TABLE
CREATE TABLE IF NOT EXISTS trains (
    id SERIAL PRIMARY KEY,
    train_number VARCHAR(10) NOT NULL UNIQUE,
    train_name VARCHAR(150) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time VARCHAR(10) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    duration VARCHAR(20) NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 120 CHECK (total_seats > 0),
    train_type VARCHAR(50) NOT NULL DEFAULT 'Express',
    classes VARCHAR(50) NOT NULL DEFAULT '1A,2A,3A,SL,CC',
    base_fare NUMERIC(10, 2) NOT NULL DEFAULT 850.00 CHECK (base_fare >= 0),
    train_status VARCHAR(20) NOT NULL DEFAULT 'ON_TIME' CHECK (train_status IN ('ON_TIME', 'DELAYED', 'CANCELLED')),
    current_station VARCHAR(100) NOT NULL,
    next_station VARCHAR(100) NOT NULL,
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    speed_kmph INTEGER NOT NULL DEFAULT 85,
    route_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    train_id INTEGER NOT NULL REFERENCES trains(id) ON DELETE RESTRICT,
    pnr VARCHAR(15) NOT NULL UNIQUE,
    journey_date VARCHAR(12) NOT NULL,
    passenger_name VARCHAR(150) NOT NULL,
    passenger_age INTEGER NOT NULL DEFAULT 28 CHECK (passenger_age BETWEEN 1 AND 120),
    passenger_gender VARCHAR(20) NOT NULL DEFAULT 'Other',
    seat_number VARCHAR(20) NOT NULL,
    travel_class VARCHAR(10) NOT NULL DEFAULT '3A',
    fare NUMERIC(10, 2) NOT NULL CHECK (fare >= 0),
    booking_status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED', 'WAITLISTED', 'CANCELLED')),
    waitlist_position INTEGER,
    confirmation_probability INTEGER CHECK (confirmation_probability BETWEEN 0 AND 100),
    booking_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(30) NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'CARD', 'NET_BANKING')),
    payment_status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    transaction_reference VARCHAR(64) NOT NULL UNIQUE,
    payment_gateway VARCHAR(50) NOT NULL DEFAULT 'SMART_RAIL_GATEWAY',
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    refund_status VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (refund_status IN ('NONE', 'INITIATED', 'PROCESSING', 'COMPLETED')),
    refund_amount NUMERIC(10, 2) DEFAULT 0.00 CHECK (refund_amount >= 0),
    refund_date TIMESTAMP WITH TIME ZONE
);

-- 5. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Train Delay', 'Cleanliness', 'Staff Behaviour', 'Food/Catering', 'Safety', 'Seat Issue', 'Payment Issue', 'Booking Issue', 'Other')),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED')),
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    assigned_staff VARCHAR(100),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 6. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL,
    sentiment VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL' CHECK (sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
    sentiment_confidence INTEGER NOT NULL DEFAULT 85 CHECK (sentiment_confidence BETWEEN 0 AND 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. SEATS TABLE (For ACID Seat Reservation)
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    train_id INTEGER NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
    journey_date VARCHAR(12) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    travel_class VARCHAR(10) NOT NULL DEFAULT '3A',
    is_booked BOOLEAN NOT NULL DEFAULT FALSE,
    booked_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_train_date_seat UNIQUE(train_id, journey_date, seat_number)
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    metadata TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
