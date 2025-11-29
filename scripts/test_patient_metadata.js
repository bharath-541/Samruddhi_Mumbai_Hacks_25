#!/usr/bin/env node

/**
 * Test Patient Registration Metadata Flow
 * 
 * This script tests:
 * 1. Register a new patient
 * 2. Login immediately after
 * 3. Verify JWT contains patient_id metadata
 * 4. Test accessing /ehr/my/prescription endpoint
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testPatientMetadata() {
  console.log('🧪 Testing Patient Metadata Flow...\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  // Generate unique test user
  const timestamp = Date.now();
  const testEmail = `metadata-test-${timestamp}@example.com`;
  const testPassword = 'TestPass123!';
  const testName = 'Metadata Test User';

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

    // Step 2: Wait a moment for metadata to propagate
    console.log('⏳ Waiting 2 seconds for metadata to propagate...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

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
    console.log('Response:', JSON.stringify(loginData, null, 2));

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    accessToken = loginData.session?.access_token;
    if (!accessToken) {
      throw new Error('No access token returned from login');
    }

    console.log(`✅ Login successful! Access token: ${accessToken.substring(0, 20)}...\n`);

    // Step 4: Decode JWT to check metadata
    console.log('🔍 Step 3: Decoding JWT to verify metadata...');
    const tokenParts = accessToken.split('.');
    if (tokenParts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
    console.log('JWT Payload:');
    console.log(JSON.stringify(payload, null, 2));

    const patientIdInToken = payload.user_metadata?.patient_id;
    console.log(`\npatient_id in JWT: ${patientIdInToken}`);
    console.log(`Expected patient_id: ${patientId}`);

    if (!patientIdInToken) {
      console.error('❌ ERROR: patient_id NOT found in JWT user_metadata!');
      console.error('This will cause 403 errors on /ehr/my/* endpoints');
      return false;
    }

    if (patientIdInToken !== patientId) {
      console.error(`❌ ERROR: patient_id mismatch! Token: ${patientIdInToken}, Expected: ${patientId}`);
      return false;
    }

    console.log('✅ patient_id correctly set in JWT metadata!\n');

    // Step 5: Test /ehr/my/prescription endpoint
    console.log('📋 Step 4: Testing /ehr/my/prescription endpoint...');
    const prescriptionRes = await fetch(`${BASE_URL}/ehr/my/prescription`, {
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
        notes: 'Test prescription from metadata test script',
        document_url: 'https://example.com/test-prescription.pdf'
      })
    });

    const prescriptionData = await prescriptionRes.json();
    console.log(`Status: ${prescriptionRes.status}`);
    console.log('Response:', JSON.stringify(prescriptionData, null, 2));

    if (!prescriptionRes.ok) {
      if (prescriptionRes.status === 403) {
        console.error('❌ ERROR: 403 Forbidden - patient_id metadata issue!');
        return false;
      }
      throw new Error(`Prescription endpoint failed: ${JSON.stringify(prescriptionData)}`);
    }

    console.log('✅ Prescription endpoint works!\n');

    // Step 6: Verify prescription was added
    console.log('🔍 Step 5: Fetching prescriptions to verify...');
    const getPrescriptionsRes = await fetch(`${BASE_URL}/ehr/my/prescriptions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const prescriptionsData = await getPrescriptionsRes.json();
    console.log(`Status: ${getPrescriptionsRes.status}`);
    console.log('Response:', JSON.stringify(prescriptionsData, null, 2));

    if (prescriptionsData.prescriptions?.length > 0) {
      console.log('✅ Prescription successfully added and retrieved!\n');
    }

    console.log('🎉 ALL TESTS PASSED! Patient metadata flow is working correctly.\n');
    return true;

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testPatientMetadata()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
