import { ConsentScope } from '../types/ehr';

export type ConsentRecord = {
  patientId: string;
  recipientId: string;
  recipientHospitalId?: string;
  scope: ConsentScope[]; // Changed from string to array
  grantedAt: string;
  expiresAt: string;
  revoked: boolean;
};

const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

async function upstash<T>(method: 'GET'|'POST', path: string): Promise<T> {
  if (!baseUrl || !token) throw new Error('Upstash Redis REST not configured');
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Upstash error: ${res.status}`);
  return res.json() as Promise<T>;
}

export async function setConsent(jti: string, value: ConsentRecord, ttlSeconds: number) {
  const encoded = encodeURIComponent(JSON.stringify(value));
  // SET key value EX ttl
  return upstash('POST', `/set/consent:${jti}/${encoded}?EX=${ttlSeconds}`);
}

export async function getConsent(jti: string): Promise<ConsentRecord | null> {
  const out = await upstash<{ result: string | null }>('GET', `/get/consent:${jti}`);
  if (!out.result) return null;
  try { return JSON.parse(out.result); } catch { return null; }
}

export async function revokeConsent(jti: string) {
  const rec = await getConsent(jti);
  if (!rec) return false;
  rec.revoked = true;
  const ttl = Math.max(1, Math.floor((new Date(rec.expiresAt).getTime() - Date.now())/1000));
  
  // Set revocation flag for fast checking
  await upstash('POST', `/set/consent:${jti}:revoked/1?EX=${ttl}`);
  
  // Update main record
  await setConsent(jti, rec, ttl);
  return true;
}

export async function isConsentRevoked(jti: string): Promise<boolean> {
  const out = await upstash<{ result: number | null }>('GET', `/exists/consent:${jti}:revoked`);
  return out.result === 1;
}

export async function addToPatientIndex(patientId: string, jti: string) {
  return upstash('POST', `/sadd/patient:${patientId}:consents/${jti}`);
}

export async function addToHospitalIndex(hospitalId: string, jti: string) {
  return upstash('POST', `/sadd/hospital:${hospitalId}:consents/${jti}`);
}

export async function getPatientConsents(patientId: string): Promise<string[]> {
  const out = await upstash<{ result: string[] }>('GET', `/smembers/patient:${patientId}:consents`);
  return out.result || [];
}

export async function getHospitalConsents(hospitalId: string): Promise<string[]> {
  const out = await upstash<{ result: string[] }>('GET', `/smembers/hospital:${hospitalId}:consents`);
  return out.result || [];
}

export async function isConsentValid(
  jti: string, 
  expect: { 
    recipientId: string; 
    requiredScope?: ConsentScope; 
    now?: Date 
  }
) {
  // Fast path: check revocation flag first
  const revoked = await isConsentRevoked(jti);
  if (revoked) return false;
  
  const rec = await getConsent(jti);
  if (!rec) return false;
  if (rec.revoked) return false;
  const now = expect.now ?? new Date();
  if (new Date(rec.expiresAt) <= now) return false;
  if (rec.recipientId !== expect.recipientId) return false;
  
  // Check if required scope is in granted scopes
  if (expect.requiredScope && !rec.scope.includes(expect.requiredScope)) {
    return false;
  }
  
  return true;
}
