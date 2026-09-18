const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');

// Person 3 module: complaint intake and resolution workflow data.

const categories = ['Cleanliness', 'Food & Catering', 'Electrical & AC', 'Staff Behavior', 'Delay', 'Other'];

const submitComplaint = async (req, res, next) => {
  try {
    requireFields(req.body, ['category', 'description']);
    const { category, description, pnr = null } = req.body;
    if (!categories.includes(category)) throw createError(400, 'Invalid complaint category');
    if (String(description).trim().length < 10) throw createError(400, 'Describe the issue in at least 10 characters');
    if (pnr) {
      const [bookings] = await pool.execute('SELECT booking_id FROM bookings WHERE pnr_number = ? AND user_id = ?', [pnr, req.user.id]);
      if (!bookings.length) throw createError(400, 'PNR does not belong to your account');
    }
    const [result] = await pool.execute('INSERT INTO complaints (user_id, pnr_number, category, description) VALUES (?, ?, ?, ?)', [req.user.id, pnr || null, category, String(description).trim()]);
    res.status(201).json({ success: true, message: 'Complaint submitted', data: { id: `CMP_${result.insertId}`, status: 'OPEN' } });
  } catch (error) { next(error); }
};

const getUserComplaints = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT CONCAT('CMP_', complaint_id) AS id, pnr_number AS pnr, category, description, status,
              sentiment_label AS sentiment, DATE_FORMAT(created_at, '%Y-%m-%d') AS date
       FROM complaints WHERE user_id = ? ORDER BY created_at DESC`, [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (error) { next(error); }
};

module.exports = { submitComplaint, getUserComplaints };
