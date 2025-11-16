import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyConsent } from '../lib/jwt';
import { isConsentValid } from '../lib/redis';

export async function requireConsent(req: Request, res: Response, next: NextFunction) {
  try {
    const staffAuth = req.header('Authorization');
    const consentToken = req.header('X-Consent-Token');
    if (!staffAuth || !staffAuth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing staff Authorization' });
    }
    if (!consentToken) {
      return res.status(401).json({ error: 'Missing X-Consent-Token' });
    }
    const staffJWT = staffAuth.slice('Bearer '.length);
    let staff: any;
    try {
      staff = jwt.verify(staffJWT, process.env.JWT_SECRET || 'dev-secret');
    } catch (e: any) {
      return res.status(401).json({ error: 'Invalid staff JWT' });
    }
    let consentClaims;
    try {
      consentClaims = verifyConsent(consentToken);
    } catch (e: any) {
      return res.status(401).json({ error: 'Invalid consent token' });
    }
    const ok = await isConsentValid(consentClaims.jti, {
      recipientId: staff.sub || staff.user_id || staff.id,
      scope: consentClaims.scope,
    });
    if (!ok) return res.status(403).json({ error: 'Consent not valid' });
    (req as any).staff = staff;
    (req as any).consent = consentClaims;
    next();
  } catch (err) {
    next(err);
  }
}
