const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');

// Person 2 module: timetable and capacity administration.

const fields = ['trainNumber', 'sourceStationCode', 'destinationStationCode', 'departureTime', 'arrivalTime', 'distanceKm', 'totalSeatsAc', 'totalSeatsSleeper', 'fareAc', 'fareSleeper', 'runningDays'];

const listSchedules = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`SELECT s.schedule_id AS scheduleId, s.train_number AS trainNumber, t.train_name AS trainName,
      s.source_station_code AS sourceStationCode, s.destination_station_code AS destinationStationCode,
      s.departure_time AS departureTime, s.arrival_time AS arrivalTime, s.distance_km AS distanceKm,
      s.total_seats_ac AS totalSeatsAc, s.total_seats_sleeper AS totalSeatsSleeper, s.fare_ac AS fareAc,
      s.fare_sleeper AS fareSleeper, s.running_days AS runningDays
      FROM schedules s JOIN trains t ON t.train_number = s.train_number ORDER BY s.schedule_id DESC`);
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

const normalize = (body) => ({
  trainNumber: body.trainNumber, sourceStationCode: body.sourceStationCode, destinationStationCode: body.destinationStationCode,
  departureTime: body.departureTime, arrivalTime: body.arrivalTime, distanceKm: Number(body.distanceKm),
  totalSeatsAc: Number(body.totalSeatsAc), totalSeatsSleeper: Number(body.totalSeatsSleeper), fareAc: Number(body.fareAc),
  fareSleeper: Number(body.fareSleeper), runningDays: body.runningDays
});

const validate = (data) => {
  if (data.sourceStationCode === data.destinationStationCode) throw createError(400, 'Source and destination must differ');
  if ([data.distanceKm, data.totalSeatsAc, data.totalSeatsSleeper, data.fareAc, data.fareSleeper].some((value) => !Number.isFinite(value) || value < 0)) throw createError(400, 'Schedule capacities, fares, and distance must be valid positive values');
  if (!data.totalSeatsAc && !data.totalSeatsSleeper) throw createError(400, 'At least one class must have seats');
};

const createSchedule = async (req, res, next) => {
  try {
    requireFields(req.body, fields);
    const data = normalize(req.body); validate(data);
    const [result] = await pool.execute(`INSERT INTO schedules (train_number, source_station_code, destination_station_code, departure_time, arrival_time, distance_km, total_seats_ac, total_seats_sleeper, fare_ac, fare_sleeper, running_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, Object.values(data));
    res.status(201).json({ success: true, message: 'Schedule created', data: { scheduleId: result.insertId } });
  } catch (error) { next(error); }
};

const updateSchedule = async (req, res, next) => {
  try {
    requireFields(req.body, fields);
    const data = normalize(req.body); validate(data);
    const [result] = await pool.execute(`UPDATE schedules SET train_number=?, source_station_code=?, destination_station_code=?, departure_time=?, arrival_time=?, distance_km=?, total_seats_ac=?, total_seats_sleeper=?, fare_ac=?, fare_sleeper=?, running_days=? WHERE schedule_id=?`, [...Object.values(data), req.params.scheduleId]);
    if (!result.affectedRows) throw createError(404, 'Schedule not found');
    res.json({ success: true, message: 'Schedule updated' });
  } catch (error) { next(error); }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const [result] = await pool.execute('DELETE FROM schedules WHERE schedule_id = ?', [req.params.scheduleId]);
    if (!result.affectedRows) throw createError(404, 'Schedule not found');
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) { next(error); }
};

module.exports = { listSchedules, createSchedule, updateSchedule, deleteSchedule };
