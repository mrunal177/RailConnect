-- ============================================================================
-- RailConnect AI Database Schema (DDL Template)
-- Database: MySQL 8.0+
-- Project: RailConnect AI — Intelligent Railway Reservation & Passenger Platform
-- ============================================================================

CREATE DATABASE IF NOT EXISTS railconnect_db;
USE railconnect_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(15),
    role ENUM('passenger', 'admin') DEFAULT 'passenger',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- PERSON 1: security audit trail for identity and privileged actions.
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 2. STATIONS TABLE
CREATE TABLE IF NOT EXISTS stations (
    station_code VARCHAR(10) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    platform_count INT DEFAULT 4,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TRAINS TABLE
CREATE TABLE IF NOT EXISTS trains (
    train_number VARCHAR(10) PRIMARY KEY,
    train_name VARCHAR(120) NOT NULL,
    train_type ENUM('Vande Bharat', 'Rajdhani', 'Shatabdi', 'Superfast Express', 'Mail Express') NOT NULL,
    total_coaches INT DEFAULT 16,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    train_number VARCHAR(10) NOT NULL,
    source_station_code VARCHAR(10) NOT NULL,
    destination_station_code VARCHAR(10) NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    distance_km INT NOT NULL,
    total_seats_ac INT DEFAULT 120,
    total_seats_sleeper INT DEFAULT 300,
    fare_ac DECIMAL(10, 2) NOT NULL,
    fare_sleeper DECIMAL(10, 2) NOT NULL,
    running_days VARCHAR(50) DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    FOREIGN KEY (train_number) REFERENCES trains(train_number) ON DELETE CASCADE,
    FOREIGN KEY (source_station_code) REFERENCES stations(station_code),
    FOREIGN KEY (destination_station_code) REFERENCES stations(station_code)
);


-- 5. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    pnr_number VARCHAR(12) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    schedule_id INT NOT NULL,
    journey_date DATE NOT NULL,
    class_type ENUM('1A', '2A', '3A', 'SL', 'CC') NOT NULL,
    passenger_count INT DEFAULT 1,
    total_fare DECIMAL(10, 2) NOT NULL,
    booking_status ENUM('CONFIRMED', 'WAITLIST', 'CANCELLED') DEFAULT 'CONFIRMED',
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id)
);


-- 6. PASSENGER TICKETS TABLE
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_age INT NOT NULL,
    passenger_gender ENUM('Male', 'Female', 'Other') NOT NULL,
    coach_number VARCHAR(10),
    seat_number VARCHAR(10),
    ticket_status ENUM('CONFIRMED', 'WL', 'CANCELLED') DEFAULT 'CONFIRMED',
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);


-- 7. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_ref VARCHAR(50) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet') NOT NULL,
    payment_status ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') DEFAULT 'SUCCESS',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- 8. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS complaints (
    complaint_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    pnr_number VARCHAR(12),
    category ENUM('Cleanliness', 'Food & Catering', 'Electrical & AC', 'Staff Behavior', 'Delay', 'Other') NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    sentiment_label ENUM('Positive', 'Neutral', 'Negative') DEFAULT 'Neutral',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    train_number VARCHAR(10),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (train_number) REFERENCES trains(train_number) ON DELETE SET NULL
);
