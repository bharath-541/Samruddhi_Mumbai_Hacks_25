import { Request, Response, NextFunction } from 'express';
import { verifyConsent } from '../lib/jwt';
import { getConsent, isConsentRevoked } from '../lib/redis';
import { ConsentScope } from '../types/ehr';
import { AuthenticatedRequest } from './auth';

export interface ConsentRequest extends AuthenticatedRequest {
  consent?: {
    patientId: string;
    scopes: ConsentScope[];
    jti: string;
    hospitalId?: string;
  };
}

/**
 * Middleware to validate consent token
 * Requires: Authorization header (staff JWT via requireAuth)
 * Requires: X-Consent-Token header (consent JWT from patient)
 * Validates: consent not revoked, not expired, staff is recipient, hospital matches
 */
export async function requireConsent(
  req: ConsentRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const consentToken = req.header('X-Consent-Token');
    
    if (!consentToken) {
      res.status(401).json({ error: 'Missing X-Consent-Token header' });
      return;
    }

    // Verify consent JWT signature
    let consentClaims;
    try {
      consentClaims = verifyConsent(consentToken);
    } catch (e: any) {
      res.status(401).json({ error: 'Invalid consent token' });
      return;
    }

    // Fast path: check revocation flag first
    const revoked = await isConsentRevoked(consentClaims.jti);
    if (revoked) {
      res.status(403).json({ error: 'Consent has been revoked' });
      return;
    }

    // Check Redis for consent record (validates TTL)
    const consentRecord = await getConsent(consentClaims.jti);
    
    if (!consentRecord) {
      res.status(403).json({ error: 'Consent not found or expired' });
      return;
    }

    if (consentRecord.revoked) {
      res.status(403).json({ error: 'Consent has been revoked' });
      return;
    }

    // Verify expiry
    if (new Date(consentRecord.expiresAt) <= new Date()) {
      res.status(403).json({ error: 'Consent has expired' });
      return;
    }

    // Verify staff is the recipient (from requireAuth middleware)
    if (req.user && consentRecord.recipientId !== req.user.id) {
      res.status(403).json({ error: 'Consent not granted to this staff member' });
      return;
    }

    // Verify hospital matches (if staff has hospital_id claim)
    if (req.user?.hospitalId && consentRecord.recipientHospitalId) {
      if (req.user.hospitalId !== consentRecord.recipientHospitalId) {
        res.status(403).json({ error: 'Consent not granted to this hospital' });
        return;
      }
    }

    // Attach consent info to request
    req.consent = {
      patientId: consentRecord.patientId,
      scopes: consentRecord.scope,
      jti: consentClaims.jti,
      hospitalId: consentRecord.recipientHospitalId,
    };

    next();
  } catch (err) {
    req.log?.error({ err }, 'Consent validation failed');
    res.status(500).json({ error: 'Consent validation failed' });
  }
}

/**
 * Helper middleware to require specific consent scope
 * Use after requireConsent
 */
export function requireConsentScope(...requiredScopes: ConsentScope[]) {
  return (req: ConsentRequest, res: Response, next: NextFunction): void => {
    if (!req.consent) {
      res.status(403).json({ error: 'Consent required' });
      return;
    }

    const hasAllScopes = requiredScopes.every(scope => 
      req.consent!.scopes.includes(scope)
    );

    if (!hasAllScopes) {
      res.status(403).json({ 
        error: 'Insufficient consent scope',
        required: requiredScopes,
        granted: req.consent.scopes
      });
      return;
    }

    next();
  };
}
