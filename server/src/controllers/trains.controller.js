const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');

// Person 2 module: trains, routes, schedules, seats, and availability search.

const scheduleClasses = (schedule) => {
  const classes = [];
  if (Number(schedule.total_seats_ac) > 0) classes.push({ type: 'CC', label: 'AC Chair Car', price: Number(schedule.fare_ac), capacity: Number(schedule.total_seats_ac) });
  if (Number(schedule.total_seats_sleeper) > 0) classes.push({ type: 'SL', label: 'Sleeper', price: Number(schedule.fare_sleeper), capacity: Number(schedule.total_seats_sleeper) });
  return classes;
};

const searchTrains = async (req, res, next) => {
  try {
    const { source, destination, date } = req.query;
    if (!source || !destination || !date) throw createError(400, 'source, destination, and date are required');
    if (source === destination) throw createError(400, 'Source and destination must be different');
    const [schedules] = await pool.execute(
      `SELECT s.*, t.train_name, t.train_type, src.station_name AS source_name, dest.station_name AS destination_name
       FROM schedules s
       JOIN trains t ON t.train_number = s.train_number
       JOIN stations src ON src.station_code = s.source_station_code
       JOIN stations dest ON dest.station_code = s.destination_station_code
       WHERE s.source_station_code = ? AND s.destination_station_code = ? AND t.is_active = TRUE`,
      [source, destination]
    );
    const data = await Promise.all(schedules.map(async (schedule) => {
      const [counts] = await pool.execute(
        `SELECT b.class_type, COUNT(t.ticket_id) AS used_seats
         FROM bookings b JOIN tickets t ON t.booking_id = b.booking_id
         WHERE b.schedule_id = ? AND b.journey_date = ? AND b.booking_status = 'CONFIRMED' AND t.ticket_status = 'CONFIRMED'
         GROUP BY b.class_type`,
        [schedule.schedule_id, date]
      );
      const used = Object.fromEntries(counts.map((row) => [row.class_type, Number(row.used_seats)]));
      return {
        id: String(schedule.schedule_id), scheduleId: schedule.schedule_id, trainNumber: schedule.train_number,
        trainName: schedule.train_name, trainType: schedule.train_type, source: schedule.source_station_code,
        sourceName: schedule.source_name, destination: schedule.destination_station_code, destinationName: schedule.destination_name,
        departureTime: schedule.departure_time, arrivalTime: schedule.arrival_time, duration: null, runsOn: schedule.running_days.split(','),
        classes: scheduleClasses(schedule).map((item) => ({ ...item, available: Math.max(0, item.capacity - (used[item.type] || 0)), status: 'AVAILABLE' }))
      };
    }));
    res.status(200).json({
      success: true,
      query: { source, destination, date },
      data
    });
  } catch (error) {
    next(error);
  }
};

const getTrainByNumber = async (req, res, next) => {
  try {
    const { trainNumber } = req.params;
    const [rows] = await pool.execute('SELECT train_number, train_name, train_type, total_coaches, is_active, created_at FROM trains WHERE train_number = ?', [trainNumber]);
    if (!rows[0]) throw createError(404, 'Train not found');
    const train = rows[0];
    res.status(200).json({
      success: true,
      data: {
        trainNumber: train.train_number, trainName: train.train_name, trainType: train.train_type,
        status: train.is_active ? 'Active' : 'Inactive', coaches: train.total_coaches, createdAt: train.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAllStations = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT station_code AS code, station_name AS name, city, state, platform_count AS platformCount FROM stations ORDER BY station_name');
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchTrains,
  getTrainByNumber,
  getAllStations,
  listTrains: async (req, res, next) => {
    try {
      const [rows] = await pool.execute('SELECT train_number AS trainNumber, train_name AS trainName, train_type AS trainType, total_coaches AS totalCoaches, is_active AS isActive FROM trains ORDER BY train_number');
      res.json({ success: true, data: rows });
    } catch (error) { next(error); }
  },
  createTrain: async (req, res, next) => {
    try {
      requireFields(req.body, ['trainNumber', 'trainName', 'trainType']);
      const { trainNumber, trainName, trainType, totalCoaches = 16, isActive = true } = req.body;
      await pool.execute('INSERT INTO trains (train_number, train_name, train_type, total_coaches, is_active) VALUES (?, ?, ?, ?, ?)', [trainNumber, trainName, trainType, Number(totalCoaches), Boolean(isActive)]);
      res.status(201).json({ success: true, message: 'Train created' });
    } catch (error) { next(error); }
  },
  updateTrain: async (req, res, next) => {
    try {
      requireFields(req.body, ['trainName', 'trainType']);
      const { trainName, trainType, totalCoaches = 16, isActive = true } = req.body;
      const [result] = await pool.execute('UPDATE trains SET train_name = ?, train_type = ?, total_coaches = ?, is_active = ? WHERE train_number = ?', [trainName, trainType, Number(totalCoaches), Boolean(isActive), req.params.trainNumber]);
      if (!result.affectedRows) throw createError(404, 'Train not found');
      res.json({ success: true, message: 'Train updated' });
    } catch (error) { next(error); }
  },
  deleteTrain: async (req, res, next) => {
    try {
      const [result] = await pool.execute('DELETE FROM trains WHERE train_number = ?', [req.params.trainNumber]);
      if (!result.affectedRows) throw createError(404, 'Train not found');
      res.json({ success: true, message: 'Train deleted' });
    } catch (error) { next(error); }
  }
};
