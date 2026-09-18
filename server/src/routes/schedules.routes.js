const express = require('express');
const controller = require('../controllers/schedules.controller');
const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticateUser, authorizeAdmin);
router.get('/', controller.listSchedules);
router.post('/', controller.createSchedule);
router.put('/:scheduleId', controller.updateSchedule);
router.delete('/:scheduleId', controller.deleteSchedule);

module.exports = router;
