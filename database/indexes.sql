-- SMART RAILWAY DATABASE INDEXES (POSTGRESQL)
-- Optimized for high concurrency, fast PNR lookup, route searches, and status filtering

-- 1. Users Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Trains Indexes
CREATE INDEX IF NOT EXISTS idx_trains_route ON trains(source, destination);
CREATE INDEX IF NOT EXISTS idx_trains_status ON trains(train_status);
CREATE INDEX IF NOT EXISTS idx_trains_number ON trains(train_number);

-- 3. Bookings Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_train_date ON bookings(train_id, journey_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

-- 4. Payments Indexes
CREATE INDEX IF NOT EXISTS idx_payments_txn_ref ON payments(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);

-- 5. Complaints Indexes
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);

-- 6. Feedback Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);

-- 7. Seats Indexes
CREATE INDEX IF NOT EXISTS idx_seats_availability ON seats(train_id, journey_date, is_booked);

-- 8. Audit Logs Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
