const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');

// Person 4 module: feedback collection for sentiment and travel insights.

const submitFeedback = async (req, res, next) => {
  try {
    requireFields(req.body, ['rating']);
    const { rating, comment = null, trainNumber = null } = req.body;
    if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) throw createError(400, 'Rating must be between 1 and 5');
    if (trainNumber) {
      const [trains] = await pool.execute('SELECT train_number FROM trains WHERE train_number = ?', [trainNumber]);
      if (!trains.length) throw createError(400, 'Train not found');
    }
    const [result] = await pool.execute('INSERT INTO feedback (user_id, train_number, rating, comment) VALUES (?, ?, ?, ?)', [req.user.id, trainNumber, Number(rating), comment?.trim() || null]);
    res.status(201).json({ success: true, message: 'Feedback saved', data: { feedbackId: result.insertId } });
  } catch (error) { next(error); }
};

module.exports = { submitFeedback };
