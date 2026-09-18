const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/', authenticateUser, feedbackController.submitFeedback);

module.exports = router;
