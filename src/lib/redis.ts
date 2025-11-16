type ConsentRecord = {
  patientId: string;
  recipientId: string;
  scope: string;
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
  await setConsent(jti, rec, ttl);
  return true;
}

export async function isConsentValid(jti: string, expect: { recipientId: string; scope: string; now?: Date }) {
  const rec = await getConsent(jti);
  if (!rec) return false;
  if (rec.revoked) return false;
  const now = expect.now ?? new Date();
  if (new Date(rec.expiresAt) <= now) return false;
  if (rec.recipientId !== expect.recipientId) return false;
  if (!rec.scope || !expect.scope.startsWith(rec.scope.split(' ')[0])) return false;
  return true;
}
