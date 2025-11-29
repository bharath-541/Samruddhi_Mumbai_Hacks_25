#!/usr/bin/env node

/**
 * Test Patient EHR Endpoints
 * 
 * This script:
 * 1. Creates a new patient
 * 2. Logs in to get JWT token
 * 3. Tests all /ehr/my/* endpoints
 * 4. Checks if patient_id is in JWT metadata
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testEHREndpoints() {
  console.log('🧪 Testing Patient EHR Endpoints...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `ehr-test-${timestamp}@example.com`;
  const testPassword = 'TestPass123!';
  const testName = 'EHR Test User';

  let accessToken = '';
  let patientId = '';

  try {
    // Step 1: Register
    console.log('📝 Step 1: Registering new patient...');
    const registerRes = await fetch(`${BASE_URL}/auth/patient/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
        dob: '1990-01-01',
        gender: 'male',
        bloodGroup: 'O+',
        phone: '+919876543210',
        address: {
          street: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      })
    });

    const registerData = await registerRes.json();
    console.log(`Status: ${registerRes.status}`);
    console.log('Response:', JSON.stringify(registerData, null, 2));

    if (!registerRes.ok) {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }

    patientId = registerData.patient?.id;
    console.log(`✅ Registration successful! Patient ID: ${patientId}\n`);

    // Step 2: Wait for metadata to propagate
    console.log('⏳ Waiting 3 seconds for metadata to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Login
    console.log('🔐 Step 2: Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/patient/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const loginData = await loginRes.json();
    console.log(`Status: ${loginRes.status}`);

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    accessToken = loginData.session?.access_token;
    if (!accessToken) {
      throw new Error('No access token returned from login');
    }

    console.log(`✅ Login successful!\n`);

    // Step 4: Decode JWT to verify metadata
    console.log('🔍 Step 3: Decoding JWT to verify metadata...');
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('JWT Payload (user_metadata):');
    console.log(JSON.stringify(payload.user_metadata || {}, null, 2));

    const patientIdInToken = payload.user_metadata?.patient_id;
    const roleInToken = payload.user_metadata?.role;
    
    console.log(`\n✓ role: ${roleInToken}`);
    console.log(`✓ patient_id: ${patientIdInToken}`);
    console.log(`✓ Expected patient_id: ${patientId}\n`);

    if (!patientIdInToken) {
      console.error('❌ ERROR: patient_id NOT found in JWT user_metadata!');
      return false;
    }

    if (patientIdInToken !== patientId) {
      console.error(`❌ ERROR: patient_id mismatch!`);
      return false;
    }

    console.log('✅ JWT metadata is correct!\n');

    // Step 5: Test GET /ehr/my
    console.log('📋 Step 4: Testing GET /ehr/my...');
    const ehrRes = await fetch(`${BASE_URL}/ehr/my`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const ehrData = await ehrRes.json();
    console.log(`Status: ${ehrRes.status}`);
    console.log('Response:', JSON.stringify(ehrData, null, 2));

    if (!ehrRes.ok) {
      console.error(`❌ GET /ehr/my failed with status ${ehrRes.status}`);
      return false;
    }

    console.log('✅ GET /ehr/my works!\n');

    // Step 6: Test GET /ehr/my/prescriptions
    console.log('📋 Step 5: Testing GET /ehr/my/prescriptions...');
    const prescriptionsRes = await fetch(`${BASE_URL}/ehr/my/prescriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const prescriptionsData = await prescriptionsRes.json();
    console.log(`Status: ${prescriptionsRes.status}`);
    console.log('Response:', JSON.stringify(prescriptionsData, null, 2));

    if (!prescriptionsRes.ok) {
      console.error(`❌ GET /ehr/my/prescriptions failed with status ${prescriptionsRes.status}`);
      return false;
    }

    console.log('✅ GET /ehr/my/prescriptions works!\n');

    // Step 7: Test POST /ehr/my/prescription
    console.log('📋 Step 6: Testing POST /ehr/my/prescription...');
    const addPrescriptionRes = await fetch(`${BASE_URL}/ehr/my/prescription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        medication_name: 'Test Medicine',
        dosage: '10mg',
        frequency: 'Twice daily',
        duration: '7 days',
        prescribed_by: 'Dr. Test',
        prescribed_date: new Date().toISOString().split('T')[0],
        notes: 'Test prescription',
        document_url: 'https://example.com/test-prescription.pdf'
      })
    });

    const addPrescriptionData = await addPrescriptionRes.json();
    console.log(`Status: ${addPrescriptionRes.status}`);
    console.log('Response:', JSON.stringify(addPrescriptionData, null, 2));

    if (!addPrescriptionRes.ok) {
      console.error(`❌ POST /ehr/my/prescription failed with status ${addPrescriptionRes.status}`);
      return false;
    }

    console.log('✅ POST /ehr/my/prescription works!\n');

    // Step 8: Verify prescription was added
    console.log('🔍 Step 7: Verifying prescription was added...');
    const verifyRes = await fetch(`${BASE_URL}/ehr/my/prescriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const verifyData = await verifyRes.json();
    console.log(`Status: ${verifyRes.status}`);
    console.log('Prescriptions count:', verifyData.prescriptions?.length || 0);

    if (verifyData.prescriptions?.length > 0) {
      console.log('✅ Prescription successfully added!\n');
    } else {
      console.error('❌ Prescription was not found in EHR\n');
      return false;
    }

    console.log('🎉 ALL TESTS PASSED! All EHR endpoints are working correctly.\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    return false;
  }
}

// Run the test
testEHREndpoints()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
