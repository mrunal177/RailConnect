const express = require('express');
const router = express.Router();
const paymentsController = require('../controllers/payments.controller');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/process', authenticateUser, paymentsController.processPayment);

module.exports = router;
