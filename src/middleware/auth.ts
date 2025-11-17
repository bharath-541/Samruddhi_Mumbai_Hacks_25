import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '../lib/env';

const env = loadEnv();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY || '');

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    hospitalId?: string;
    patientId?: string;
  };
}

/**
 * Middleware to validate Supabase Auth JWT
 * Extracts custom claims: role, hospital_id, patient_id
 * Attaches user object to req for downstream use
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Extract custom claims from JWT
    // @ts-ignore - custom claims added by our hook
    const role = data.user.user_metadata?.role || data.user.app_metadata?.role;
    // @ts-ignore
    const hospitalId = data.user.user_metadata?.hospital_id || data.user.app_metadata?.hospital_id;
    // @ts-ignore
    const patientId = data.user.user_metadata?.patient_id || data.user.app_metadata?.patient_id;

    // Attach user to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      role,
      hospitalId,
      patientId,
    };

    next();
  } catch (error: any) {
    req.log?.error({ err: error }, 'Auth validation failed');
    res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Middleware to require specific role
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (req.user.role && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Insufficient permissions', requiredRole: roles });
    }
  };
}

/**
 * Middleware to require hospital context
 * Ensures user belongs to a hospital
 */
export function requireHospital(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user?.hospitalId) {
    res.status(403).json({ error: 'Hospital context required' });
    return;
  }
  next();
}
