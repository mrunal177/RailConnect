import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { pool } from '../db/index.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { dbUserId?: number; dbRole?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Find or sync DB user record
    const userResult = await pool.query(
      'SELECT id, role, email, name FROM users WHERE uid = $1',
      [decodedToken.uid]
    );

    let dbUserId: number;
    let dbRole = 'PASSENGER';

    if (userResult.rows.length === 0) {
      // Auto-register user into PostgreSQL
      const name = decodedToken.name || (decodedToken.email ? decodedToken.email.split('@')[0] : 'Passenger');
      const email = decodedToken.email || `${decodedToken.uid}@railway.local`;
      const role = (email.toLowerCase().includes('admin') || email.toLowerCase().includes('mrunal')) ? 'ADMIN' : 'PASSENGER';
      
      const insertResult = await pool.query(
        `INSERT INTO users (uid, name, email, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (uid) DO UPDATE SET email = EXCLUDED.email 
         RETURNING id, role`,
        [decodedToken.uid, name, email, role]
      );
      dbUserId = insertResult.rows[0].id;
      dbRole = insertResult.rows[0].role;
    } else {
      dbUserId = userResult.rows[0].id;
      dbRole = userResult.rows[0].role;
    }

    req.user = {
      ...decodedToken,
      dbUserId,
      dbRole,
    };
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.dbRole) {
      return res.status(403).json({ error: 'Access forbidden: User role not determined' });
    }
    if (!roles.includes(req.user.dbRole)) {
      return res.status(403).json({
        error: `Access forbidden: Requires one of [${roles.join(', ')}] permissions. Current role: ${req.user.dbRole}`,
      });
    }
    next();
  };
};
