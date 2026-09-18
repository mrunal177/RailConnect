// Person 1 module: best-effort security audit writer.
const { pool } = require('../config/db');

const audit = async (userId, action, metadata = {}) => {
  try { await pool.execute('INSERT INTO audit_logs (user_id, action, metadata) VALUES (?, ?, ?)', [userId || null, action, JSON.stringify(metadata)]); }
  catch (error) { console.warn(`[Audit Warning] ${action} was not recorded: ${error.message}`); }
};

module.exports = { audit };
