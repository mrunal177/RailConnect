// Person 3 module: payment records and settlement references.
const { pool } = require('../config/db');
const { createError, requireFields } = require('../utils/http');
const { generateReference } = require('../utils/security');

const processPayment = async (req, res, next) => {
  try {
    requireFields(req.body, ['pnr', 'paymentMethod']);
    const [bookings] = await pool.execute('SELECT booking_id, total_fare FROM bookings WHERE pnr_number = ? AND user_id = ?', [req.body.pnr, req.user.id]);
    if (!bookings[0]) throw createError(404, 'Booking not found');
    const [existing] = await pool.execute("SELECT payment_id FROM payments WHERE booking_id = ? AND payment_status = 'SUCCESS'", [bookings[0].booking_id]);
    if (existing.length) throw createError(409, 'This booking is already paid');
    const reference = generateReference('TXN');
    const [result] = await pool.execute("INSERT INTO payments (booking_id, transaction_ref, amount, payment_method, payment_status) VALUES (?, ?, ?, ?, 'SUCCESS')", [bookings[0].booking_id, reference, bookings[0].total_fare, req.body.paymentMethod]);
    res.status(201).json({ success: true, message: 'Payment recorded', data: { paymentId: result.insertId, transactionRef: reference, amount: Number(bookings[0].total_fare), status: 'SUCCESS' } });
  } catch (error) { next(error); }
};

module.exports = { processPayment };
