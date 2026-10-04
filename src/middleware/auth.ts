import { Request, Response, NextFunction } from 'express';
import { createClient, User } from '@supabase/supabase-js';
import { pool } from '../db/index.ts';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

export interface AuthRequest extends Request {
  user?: User & { dbUserId?: number; dbRole?: string };
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

  const token = authHeader.slice('Bearer '.length);
  if (!supabaseAuth) {
    console.error('Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
    return res.status(500).json({ error: 'Authentication service is not configured' });
  }

  let authUser: User;
  try {
    const { data, error } = await supabaseAuth.auth.getUser(token);
    if (error || !data.user) throw error || new Error('No user in token');
    authUser = data.user;
  } catch (error) {
    console.error('Error verifying Supabase access token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  try {
    // Find or sync DB user record
    const userResult = await pool.query(
      'SELECT id, role, email, name FROM users WHERE uid = $1',
      [authUser.id]
    );

    let dbUserId: number;
    let dbRole = 'PASSENGER';

    if (userResult.rows.length === 0) {
      // Auto-register user into PostgreSQL
      const email = authUser.email || `${authUser.id}@railway.local`;
      const name = String(authUser.user_metadata?.full_name || authUser.user_metadata?.name || email.split('@')[0] || 'Passenger');
      
      const insertResult = await pool.query(
        `INSERT INTO users (uid, name, email, role) 
         VALUES ($1, $2, $3, 'PASSENGER') 
         ON CONFLICT (email) DO UPDATE SET uid = EXCLUDED.uid, name = EXCLUDED.name 
         RETURNING id, role`,
        [authUser.id, name, email]
      );
      dbUserId = insertResult.rows[0].id;
      dbRole = insertResult.rows[0].role;
    } else {
      dbUserId = userResult.rows[0].id;
      dbRole = userResult.rows[0].role;
    }

    req.user = {
      ...authUser,
      dbUserId,
      dbRole,
    };
    next();
  } catch (error) {
    console.error('Error syncing Supabase user with database:', error);
    return res.status(500).json({ error: 'Could not sync your account with the database' });
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
