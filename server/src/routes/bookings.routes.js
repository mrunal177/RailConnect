const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');
const cancellationsController = require('../controllers/cancellations.controller');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/', authenticateUser, bookingsController.createBooking);
router.get('/user', authenticateUser, bookingsController.getUserBookings);
router.get('/pnr/:pnr', authenticateUser, bookingsController.getBookingByPNR);
router.post('/pnr/:pnr/cancel', authenticateUser, cancellationsController.cancelBooking);

module.exports = router;
