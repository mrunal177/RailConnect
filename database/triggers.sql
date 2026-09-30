-- SMART RAILWAY DATABASE TRIGGERS
-- Automates audit trails, seat reservation synchronization, and complaint logging

-- 1. Trigger function: Auto-create audit log on booking creation/cancellation
CREATE OR REPLACE FUNCTION audit_booking_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
        VALUES (NEW.user_id, 'BOOKING_CREATED', 'BOOKING', NEW.pnr, 
                json_build_object('train_id', NEW.train_id, 'fare', NEW.fare, 'seat', NEW.seat_number)::text);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.booking_status <> NEW.booking_status AND NEW.booking_status = 'CANCELLED' THEN
            INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
            VALUES (NEW.user_id, 'BOOKING_CANCELLED', 'BOOKING', NEW.pnr, 
                    json_build_object('train_id', NEW.train_id, 'seat', NEW.seat_number)::text);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_booking ON bookings;
CREATE TRIGGER trg_audit_booking
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_booking_event();

-- 2. Trigger function: Auto-create audit log on complaint status changes
CREATE OR REPLACE FUNCTION audit_complaint_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
        VALUES (NEW.user_id, 'COMPLAINT_CREATED', 'COMPLAINT', NEW.id::text, 
                json_build_object('category', NEW.category, 'priority', NEW.priority)::text);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF OLD.status <> NEW.status THEN
            INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
            VALUES (NEW.user_id, 'COMPLAINT_UPDATED', 'COMPLAINT', NEW.id::text, 
                    json_build_object('old_status', OLD.status, 'new_status', NEW.status, 'assigned_staff', NEW.assigned_staff)::text);
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_complaint ON complaints;
CREATE TRIGGER trg_audit_complaint
AFTER INSERT OR UPDATE ON complaints
FOR EACH ROW EXECUTE FUNCTION audit_complaint_event();
