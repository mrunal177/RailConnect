-- ============================================================================
-- RailConnect AI Stored Procedures
-- Sample procedures for complex queries, search logic, and fare calculations
-- ============================================================================

USE railconnect_db;

DELIMITER //

-- 1. PROCEDURE: Search Trains Between Stations
DROP PROCEDURE IF EXISTS sp_search_trains //
CREATE PROCEDURE sp_search_trains(
    IN p_source VARCHAR(10),
    IN p_destination VARCHAR(10)
)
BEGIN
    SELECT 
        s.schedule_id,
        t.train_number,
        t.train_name,
        t.train_type,
        s.source_station_code,
        s.destination_station_code,
        s.departure_time,
        s.arrival_time,
        s.distance_km,
        s.fare_ac,
        s.fare_sleeper,
        s.running_days
    FROM schedules s
    JOIN trains t ON s.train_number = t.train_number
    WHERE s.source_station_code = p_source 
      AND s.destination_station_code = p_destination
      AND t.is_active = TRUE;
END //

-- 2. PROCEDURE: Get Passenger Booking Details by PNR
DROP PROCEDURE IF EXISTS sp_get_booking_by_pnr //
CREATE PROCEDURE sp_get_booking_by_pnr(
    IN p_pnr VARCHAR(12)
)
BEGIN
    SELECT * FROM view_booking_details WHERE pnr_number = p_pnr;
END //

DELIMITER ;
