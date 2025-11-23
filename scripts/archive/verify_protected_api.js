const BASE_URL = 'http://localhost:3000';

// Usage: TOKEN=ey... node scripts/verify_protected_api.js
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error('❌ Error: TOKEN environment variable is required.');
    console.error('Usage: TOKEN=your_jwt_token node scripts/verify_protected_api.js');
    process.exit(1);
}

async function verifyProtectedEndpoints() {
    console.log('🔐 Verifying Protected Endpoints with provided Token...');
    console.log('='.repeat(60));

    const endpoints = [
        // Patient Self-Service (Task 2)
        { method: 'GET', path: '/ehr/my' },
        { method: 'GET', path: '/ehr/my/prescriptions' },

        // Patient Profile (Task 1)
        // Note: This requires the token to match the patient ID in the URL, so we might get 403 or 404 if ID doesn't match
        // We'll test the /ehr/my endpoints primarily as they are self-contained

        // Consent (Task 3)
        { method: 'GET', path: '/consent/my' },
        { method: 'GET', path: '/consent/received' },
    ];

    for (const ep of endpoints) {
        try {
            const res = await fetch(`${BASE_URL}${ep.path}`, {
                method: ep.method,
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });

            const status = res.status;
            const data = await res.json();

            // We expect 200 OK if token is valid and data exists
            // We expect 404 if token is valid but no data found (still better than 401)
            // We expect 403 if token is valid but permission denied
            // We expect 401 ONLY if token is invalid

            const icon = status === 401 ? '❌' : '✅';
            console.log(`${icon} ${ep.method} ${ep.path} -> ${status}`);

            if (status === 401) {
                console.log('   Error: Unauthorized (Token invalid or expired)');
            } else if (status !== 200) {
                console.log(`   Note: ${JSON.stringify(data)}`);
            }

        } catch (e) {
            console.error(`❌ ${ep.method} ${ep.path} -> Error: ${e.message}`);
        }
    }
}

verifyProtectedEndpoints();
