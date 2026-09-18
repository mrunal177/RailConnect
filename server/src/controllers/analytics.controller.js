const { pool } = require('../config/db');

// Person 4 module: feedback/sentiment and operational analytics.

const getOverviewStats = async (req, res, next) => {
  try {
    const [[bookingStats]] = await pool.query(`SELECT COUNT(*) AS totalBookings, COALESCE(SUM(total_fare), 0) AS totalRevenue,
      COALESCE(SUM(CASE WHEN DATE(booked_at) = CURDATE() THEN total_fare ELSE 0 END), 0) AS revenueToday FROM bookings WHERE booking_status != 'CANCELLED'`);
    const [[trainStats]] = await pool.query('SELECT COUNT(*) AS activeTrains FROM trains WHERE is_active = TRUE');
    const [[passengerStats]] = await pool.query("SELECT COUNT(*) AS totalPassengers FROM users WHERE role = 'passenger'");
    const [[complaintStats]] = await pool.query("SELECT COUNT(*) AS complaintsOpen FROM complaints WHERE status IN ('OPEN', 'IN_PROGRESS')");
    const [sentiment] = await pool.query('SELECT sentiment_label AS label, COUNT(*) AS count FROM complaints GROUP BY sentiment_label');
    res.json({ success: true, data: { ...bookingStats, ...trainStats, ...passengerStats, ...complaintStats, onTimePerformance: 'N/A', sentiment } });
  } catch (error) { next(error); }
};

module.exports = { getOverviewStats };
