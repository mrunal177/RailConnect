const crypto = require('crypto');

const TOKEN_TTL_SECONDS = 60 * 60 * 24;

const base64UrlEncode = (value) => Buffer.from(value).toString('base64url');
const base64UrlDecode = (value) => Buffer.from(value, 'base64url').toString('utf8');

const getTokenSecret = () => process.env.JWT_SECRET || 'change-this-development-secret';

const signToken = (payload) => {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS }));
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
};

const verifyToken = (token) => {
  const [header, body, signature] = token.split('.');
  if (!header || !body || !signature) throw new Error('Malformed access token');

  const expected = crypto.createHmac('sha256', getTokenSecret()).update(`${header}.${body}`).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error('Invalid access token');
  }

  const payload = JSON.parse(base64UrlDecode(body));
  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new Error('Access token has expired');
  return payload;
};

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
};

const verifyPassword = (password, storedHash) => {
  const [algorithm, salt, hash] = String(storedHash).split('$');
  if (algorithm !== 'scrypt' || !salt || !hash) return false;
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const derivedBuffer = Buffer.from(derived, 'hex');
  return hashBuffer.length === derivedBuffer.length && crypto.timingSafeEqual(hashBuffer, derivedBuffer);
};

const generatePnr = () => String(crypto.randomInt(1_000_000_000, 10_000_000_000));
const generateReference = (prefix) => `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 18).toUpperCase()}`;

module.exports = { signToken, verifyToken, hashPassword, verifyPassword, generatePnr, generateReference };
