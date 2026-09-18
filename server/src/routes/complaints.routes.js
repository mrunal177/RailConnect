const express = require('express');
const router = express.Router();
const complaintsController = require('../controllers/complaints.controller');
const { authenticateUser } = require('../middleware/authMiddleware');

router.post('/', authenticateUser, complaintsController.submitComplaint);
router.get('/', authenticateUser, complaintsController.getUserComplaints);

module.exports = router;
