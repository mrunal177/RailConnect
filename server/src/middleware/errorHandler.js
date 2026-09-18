const errorHandler = (err, req, res, next) => {
  console.error('[Global Error Handler]:', err.stack || err.message);

  const databaseUnavailable = err.name === 'AggregateError' || ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST'].includes(err.code);
  const statusCode = err.statusCode || (err.code === 'ER_DUP_ENTRY' ? 409 : databaseUnavailable ? 503 : 500);
  const message = err.code === 'ER_DUP_ENTRY' ? 'A record with those details already exists' : databaseUnavailable ? 'Database is unavailable. Check the MySQL connection settings.' : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;
