-- SMART RAILWAY STORED FUNCTIONS & PROCEDURES
-- Demonstrates ACID transactions, row locking, seat availability, refund calculation, and audit logging

-- 1. Helper function to generate unique 10-character alphanumeric PNR
CREATE OR REPLACE FUNCTION generate_pnr() 
RETURNS VARCHAR AS $$
DECLARE
    characters VARCHAR := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    result VARCHAR := 'SR';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(characters, floor(random() * length(characters) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Calculate refund based on cancellation lead time
CREATE OR REPLACE FUNCTION calculate_refund(
    p_fare NUMERIC,
    p_journey_date VARCHAR
) 
RETURNS NUMERIC AS $$
DECLARE
    v_days_left INTEGER;
    v_cancellation_fee NUMERIC := 120.00;
    v_refund NUMERIC;
BEGIN
    v_days_left := (TO_DATE(p_journey_date, 'YYYY-MM-DD') - CURRENT_DATE);
    
    IF v_days_left >= 3 THEN
        v_cancellation_fee := 100.00;
    ELSIF v_days_left >= 1 THEN
        v_cancellation_fee := p_fare * 0.25;
    ELSE
        v_cancellation_fee := p_fare * 0.50;
    END IF;
    
    v_refund := GREATEST(0.00, p_fare - v_cancellation_fee);
    RETURN ROUND(v_refund, 2);
END;
$$ LANGUAGE plpgsql;
