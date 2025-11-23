const BASE_URL = 'http://localhost:3000';

async function testQR() {
    console.log('🧪 TASK 3: QR Code Generation Tests');
    console.log('='.repeat(60));

    // Test 1: Generate QR without Auth (Should fail)
    console.log('\n1. Testing QR Generation without Auth...');
    const res1 = await fetch(`${BASE_URL}/consent/test-consent-id/qr`);
    console.log(`Status: ${res1.status}`);
    if (res1.status === 401) {
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401');
    }

    // Test 2: Scan QR without Data (Should fail)
    console.log('\n2. Testing QR Scan without Data...');
    const res2 = await fetch(`${BASE_URL}/consent/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    console.log(`Status: ${res2.status}`);
    if (res2.status === 401) { // Auth middleware first
        console.log('✅ Correctly rejected unauthenticated request');
    } else {
        console.log('❌ Failed: Expected 401');
    }

    console.log('\nNote: Full functional testing requires valid JWTs and Redis state.');
    console.log('Use the frontend or Postman with valid tokens for end-to-end testing.');
}

testQR();
