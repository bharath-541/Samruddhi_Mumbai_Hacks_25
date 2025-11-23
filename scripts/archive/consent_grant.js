require('dotenv').config({ path: '.env.local' });
const { signConsent } = require('../dist/lib/jwt');
const { setConsent } = require('../dist/lib/redis');

async function main() {
  const patientId = process.argv[2];
  const recipientId = process.argv[3];
  const scope = process.argv[4] || `ehr:read:patient:${patientId}`;
  const duration = parseInt(process.argv[5] || '15', 10);
  if (!patientId || !recipientId) {
    console.error('Usage: node scripts/consent_grant.js <patientId> <recipientId> [scope] [minutes]');
    process.exit(1);
  }
  const jti = crypto.randomUUID();
  const exp = Math.floor(Date.now()/1000) + duration*60;
  const token = signConsent({ sub: patientId, aud: recipientId, scope, exp, jti });
  const record = {
    patientId,
    recipientId,
    scope,
    grantedAt: new Date().toISOString(),
    expiresAt: new Date(exp*1000).toISOString(),
    revoked: false,
  };
  await setConsent(jti, record, duration*60);
  console.log(JSON.stringify({ consentId: jti, consentToken: token }, null, 2));
}

const crypto = require('node:crypto');
main().catch((e) => { console.error(e); process.exit(1); });
