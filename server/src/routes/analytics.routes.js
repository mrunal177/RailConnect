const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');

router.get('/overview', authenticateUser, authorizeAdmin, analyticsController.getOverviewStats);

module.exports = router;
