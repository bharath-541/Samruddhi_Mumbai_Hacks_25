require('dotenv').config({ path: '.env.local' });
const { setConsent, getConsent } = require('../dist/lib/redis');

(async () => {
  const jti = 'test-consent-' + Math.random().toString(36).slice(2, 10);
  const record = {
    patientId: 'patient-123',
    recipientId: 'doctor-456',
    scope: 'ehr:read:patient:patient-123',
    grantedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 300000).toISOString(),
    revoked: false,
  };

  console.log('✓ Writing to Upstash Redis:', { jti, record });
  await setConsent(jti, record, 300);

  console.log('\n✓ Reading from Upstash Redis:');
  const fetched = await getConsent(jti);
  console.log(JSON.stringify(fetched, null, 2));

  if (fetched && fetched.patientId === record.patientId) {
    console.log('\n✅ Upstash Redis working correctly!');
  } else {
    console.error('\n❌ Upstash read mismatch');
  }
})();
