const express = require('express');
const router = express.Router();
const trainsController = require('../controllers/trains.controller');
const { authenticateUser, authorizeAdmin } = require('../middleware/authMiddleware');

router.get('/search', trainsController.searchTrains);
router.get('/stations', trainsController.getAllStations);
router.get('/', authenticateUser, authorizeAdmin, trainsController.listTrains);
router.post('/', authenticateUser, authorizeAdmin, trainsController.createTrain);
router.put('/:trainNumber', authenticateUser, authorizeAdmin, trainsController.updateTrain);
router.delete('/:trainNumber', authenticateUser, authorizeAdmin, trainsController.deleteTrain);
router.get('/:trainNumber', trainsController.getTrainByNumber);

module.exports = router;
