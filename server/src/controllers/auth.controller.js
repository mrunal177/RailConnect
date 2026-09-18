const { pool } = require('../config/db');
const { signToken, hashPassword, verifyPassword } = require('../utils/security');
const { createError, requireFields } = require('../utils/http');
const { audit } = require('../utils/audit');

// Person 1 module: users, roles, authentication, and RBAC identity payloads.

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const publicUser = (user) => ({ id: user.user_id, name: user.full_name, email: user.email, phone: user.phone, role: user.role });

const registerUser = async (req, res, next) => {
  try {
    requireFields(req.body, ['fullName', 'email', 'password']);
    const { fullName, email, password, phone = null } = req.body;
    if (!emailPattern.test(email)) throw createError(400, 'Enter a valid email address');
    if (String(password).length < 8) throw createError(400, 'Password must be at least 8 characters long');
    if (String(fullName).trim().length < 2) throw createError(400, 'Full name must be at least 2 characters long');

    const [result] = await pool.execute(
      'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, \'passenger\')',
      [String(fullName).trim(), String(email).trim().toLowerCase(), hashPassword(password), phone || null]
    );
    const user = { user_id: result.insertId, full_name: String(fullName).trim(), email: String(email).trim().toLowerCase(), phone, role: 'passenger' };
    await audit(user.user_id, 'USER_REGISTERED', { email: user.email });
    res.status(200).json({
      success: true,
      message: 'Account created successfully',
      token: signToken(publicUser(user)),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    requireFields(req.body, ['email', 'password']);
    const [rows] = await pool.execute('SELECT user_id, full_name, email, password_hash, phone, role FROM users WHERE email = ?', [String(req.body.email).trim().toLowerCase()]);
    const user = rows[0];
    if (!user || !verifyPassword(req.body.password, user.password_hash)) throw createError(401, 'Invalid email or password');
    await audit(user.user_id, 'USER_LOGGED_IN', { role: user.role });
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: signToken(publicUser(user)),
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.execute('SELECT user_id, full_name, email, phone, role FROM users WHERE user_id = ?', [req.user.id]);
    if (!rows[0]) throw createError(404, 'User account was not found');
    res.status(200).json({
      success: true,
      data: publicUser(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
