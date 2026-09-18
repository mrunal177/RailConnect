const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railconnect_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 5000,
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to test DB connection gracefully
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database: "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`[Database Warning] MySQL connection failed (${error.message}).`);
    console.warn(`[Database Note] Database-backed endpoints require MySQL. Ensure MySQL is started and credentials in .env are correct.`);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
};
