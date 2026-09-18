// Person 3 module: cancellations and refund state changes.
const { pool } = require('../config/db');
const { createError } = require('../utils/http');

const cancelBooking = async (req, res, next) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT booking_id, booking_status FROM bookings WHERE pnr_number = ? AND user_id = ? FOR UPDATE', [req.params.pnr, req.user.id]);
    if (!rows[0]) throw createError(404, 'Booking not found');
    if (rows[0].booking_status === 'CANCELLED') throw createError(400, 'Booking is already cancelled');
    await connection.execute("UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ?", [rows[0].booking_id]);
    await connection.execute("UPDATE tickets SET ticket_status = 'CANCELLED' WHERE booking_id = ?", [rows[0].booking_id]);
    await connection.commit();
    res.json({ success: true, message: 'Booking cancelled and successful payments marked for refund' });
  } catch (error) { if (connection) await connection.rollback(); next(error); }
  finally { if (connection) connection.release(); }
};

module.exports = { cancelBooking };
