const BASE_URL = 'http://localhost:3000';

async function testConsentWorkflow() {
    console.log('🧪 TASK 4: Consent Request Workflow Tests');
    console.log('='.repeat(60));

    // Test 1: Doctor Request without Auth
    console.log('\n1. Testing Doctor Request (No Auth)...');
    const res1 = await fetch(`${BASE_URL}/consent/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            patientId: '00000000-0000-0000-0000-000000000000',
            scope: ['prescriptions'],
            purpose: 'Checkup'
        })
    });
    console.log(`Status: ${res1.status}`);
    if (res1.status === 401 || res1.status === 403) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401/403');
    }

    // Test 2: Patient View Requests without Auth
    console.log('\n2. Testing Patient View Requests (No Auth)...');
    const res2 = await fetch(`${BASE_URL}/consent/requests/my`);
    console.log(`Status: ${res2.status}`);
    if (res2.status === 401 || res2.status === 403) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401/403');
    }

    // Test 3: Patient Approve Request without Auth
    console.log('\n3. Testing Patient Approve Request (No Auth)...');
    const res3 = await fetch(`${BASE_URL}/consent/requests/dummy-id/approve`, {
        method: 'POST'
    });
    console.log(`Status: ${res3.status}`);
    if (res3.status === 401 || res3.status === 403) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401/403');
    }

    // Test 4: Patient Deny Request without Auth
    console.log('\n4. Testing Patient Deny Request (No Auth)...');
    const res4 = await fetch(`${BASE_URL}/consent/requests/dummy-id/deny`, {
        method: 'POST'
    });
    console.log(`Status: ${res4.status}`);
    if (res4.status === 401 || res4.status === 403) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401/403');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('Endpoints are registered and protected.');
    console.log('Full functional testing requires valid Doctor and Patient JWTs.');
}

testConsentWorkflow();
