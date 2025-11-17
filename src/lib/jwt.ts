import jwt from 'jsonwebtoken';
import { ConsentScope } from '../types/ehr';

export type ConsentClaims = {
  iss: string;
  sub: string; // patientId
  aud: string; // recipient/staff id
  hospital_id?: string; // recipient hospital id
  scope: ConsentScope[]; // Changed from string to array
  exp: number;
  iat: number;
  jti: string;
};

const secret = process.env.JWT_SECRET || 'dev-secret';

export function signConsent(claims: Omit<ConsentClaims,'iss'|'iat'>) {
  const payload: ConsentClaims = {
    iss: 'samruddhi-auth',
    iat: Math.floor(Date.now()/1000),
    ...claims,
  };
  return jwt.sign(payload, secret);
}

export function verifyConsent(token: string): ConsentClaims {
  return jwt.verify(token, secret) as ConsentClaims;
}
