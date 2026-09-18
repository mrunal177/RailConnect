const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./src/config/db');
const requestLogger = require('./src/middleware/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Route Imports
const authRoutes = require('./src/routes/auth.routes');
const trainsRoutes = require('./src/routes/trains.routes');
const bookingsRoutes = require('./src/routes/bookings.routes');
const paymentsRoutes = require('./src/routes/payments.routes');
const complaintsRoutes = require('./src/routes/complaints.routes');
const feedbackRoutes = require('./src/routes/feedback.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const schedulesRoutes = require('./src/routes/schedules.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'RailConnect AI Express API',
    status: 'Operational',
    timestamp: new Date().toISOString()
  });
});

// Modular Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/schedules', schedulesRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `API Route ${req.originalUrl} not found.`
    }
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server & Test DB Connection
app.listen(PORT, async () => {
  console.log(`\n==================================================`);
  console.log(`  RailConnect AI Express Server`);
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================\n`);
  
  await testConnection();
});

module.exports = app;
