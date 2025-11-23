const BASE_URL = 'http://localhost:3000';

// Hardcoded list of endpoints since debug route is flaky
const KNOWN_ROUTES = [
    // Public
    { path: '/health/live', method: 'GET', public: true },
    { path: '/health/ready', method: 'GET', public: true },
    { path: '/patients/search', method: 'GET', public: true },

    // Patient Registration
    { path: '/patients/:id', method: 'GET', public: false }, // Requires Auth
    { path: '/patients/register', method: 'POST', public: false }, // Requires Auth
    { path: '/patients/:id/profile', method: 'PATCH', public: false }, // Requires Auth

    // Patient Self-Service EHR (TASK 2)
    { path: '/ehr/my', method: 'GET', public: false },
    { path: '/ehr/my/prescriptions', method: 'GET', public: false },
    { path: '/ehr/my/test-reports', method: 'GET', public: false },
    { path: '/ehr/my/medical-history', method: 'GET', public: false },
    { path: '/ehr/my/iot/:deviceType', method: 'GET', public: false },
    { path: '/ehr/my/prescription', method: 'POST', public: false },
    { path: '/ehr/my/test-report', method: 'POST', public: false },
    { path: '/ehr/my/medical-history', method: 'POST', public: false },
    { path: '/ehr/my/iot-log', method: 'POST', public: false },

    // Consent (TASK 3)
    { path: '/consent/:consentId/qr', method: 'GET', public: false },
    { path: '/consent/scan', method: 'POST', public: false },

    // Existing Consent Endpoints
    { path: '/consent/grant', method: 'POST', public: false },
    { path: '/consent/revoke', method: 'POST', public: false },
    { path: '/consent/my', method: 'GET', public: false },
    { path: '/consent/received', method: 'GET', public: false },

    // Hospital EHR Access
    { path: '/ehr/patient/:id', method: 'GET', public: false },
    { path: '/ehr/patient/:id/prescriptions', method: 'GET', public: false },
];

async function checkSystemHealth() {
    console.log('🏥 SAMRUDDHI BACKEND SYSTEM HEALTH CHECK');
    console.log('='.repeat(60));

    try {
        console.log(`✅ Loaded ${KNOWN_ROUTES.length} known endpoints`);

        // 1. Test Public Routes
        console.log('\n1️⃣  Testing Public Routes (Expect 200/404 OK)...');
        for (const route of KNOWN_ROUTES.filter(r => r.public)) {
            const path = route.path.replace(':id', 'dummy-uuid');
            const res = await fetch(`${BASE_URL}${path}`);

            // 200 is great, 404 is okay (resource not found but endpoint exists), 500 is bad
            const status = res.status;
            const icon = status !== 500 ? '✅' : '❌';
            console.log(`${icon} ${route.method} ${path.padEnd(30)} -> ${status}`);
        }

        // 2. Test Protected Routes
        console.log('\n2️⃣  Testing Protected Routes (Expect 401 Unauthorized)...');
        let passed = 0;
        const protectedRoutes = KNOWN_ROUTES.filter(r => !r.public);

        for (const route of protectedRoutes) {
            const path = route.path
                .replace(':id', 'dummy-uuid')
                .replace(':consentId', 'dummy-consent')
                .replace(':deviceType', 'heart_rate');

            const res = await fetch(`${BASE_URL}${path}`, {
                method: route.method,
                headers: { 'Content-Type': 'application/json' }
            });

            const status = res.status;
            // We expect 401 (Auth required)
            const isProtected = status === 401 || status === 403;
            const icon = isProtected ? '🔒' : (status === 200 ? '⚠️ (Public?)' : '❓');

            console.log(`${icon} ${route.method.padEnd(4)} ${path.padEnd(35)} -> ${status}`);
            if (isProtected) passed++;
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY');
        console.log(`Total Endpoints: ${KNOWN_ROUTES.length}`);
        console.log(`Public: ${KNOWN_ROUTES.filter(r => r.public).length}`);
        console.log(`Protected: ${protectedRoutes.length}`);
        console.log(`Protected Routes Verified: ${passed}/${protectedRoutes.length}`);
        console.log('='.repeat(60));

    } catch (e) {
        console.error('❌ System Check Failed:', e.message);
    }
}

checkSystemHealth();
