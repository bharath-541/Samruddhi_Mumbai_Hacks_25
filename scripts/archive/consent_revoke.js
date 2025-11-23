require('dotenv').config({ path: '.env.local' });
const { revokeConsent } = require('../dist/lib/redis');

async function main() {
  const consentId = process.argv[2];
  if (!consentId) {
    console.error('Usage: node scripts/consent_revoke.js <consentId>');
    process.exit(1);
  }
  const ok = await revokeConsent(consentId);
  console.log(JSON.stringify({ consentId, revoked: ok }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
