-- ============================================================================
-- RailConnect AI Database Triggers (Person 3)
-- Example SQL triggers for automated database logic
-- ============================================================================

USE railconnect_db;

DELIMITER //

-- 1. TRIGGER: Auto-Generate PNR before booking insert (if not supplied)
DROP TRIGGER IF EXISTS trg_before_booking_insert //
CREATE TRIGGER trg_before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    IF NEW.pnr_number IS NULL OR NEW.pnr_number = '' THEN
        SET NEW.pnr_number = CONCAT(FLOOR(1000000000 + RAND() * 9000000000));
    END IF;
END //

-- 2. TRIGGER: Auto-update complaint resolved timestamp when status changed to RESOLVED
DROP TRIGGER IF EXISTS trg_before_complaint_update //
CREATE TRIGGER trg_before_complaint_update
BEFORE UPDATE ON complaints
FOR EACH ROW
BEGIN
    IF NEW.status = 'RESOLVED' AND OLD.status != 'RESOLVED' THEN
        SET NEW.resolved_at = NOW();
    END IF;
END //

-- 3. PERSON 3: Mark settled payments refundable when a reservation is cancelled.
DROP TRIGGER IF EXISTS trg_after_booking_cancel //
CREATE TRIGGER trg_after_booking_cancel
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.booking_status = 'CANCELLED' AND OLD.booking_status != 'CANCELLED' THEN
        UPDATE payments
        SET payment_status = 'REFUNDED'
        WHERE booking_id = NEW.booking_id AND payment_status = 'SUCCESS';
    END IF;
END //

DELIMITER ;
