/**
 * Authentication Endpoint Testing Script
 * Tests all protected endpoints with actual Supabase JWT tokens
 * 
 * REQUIREMENTS:
 * 1. Install: npm install @supabase/supabase-js
 * 2. Set environment variables or edit config below
 * 
 * Usage: node scripts/test_auth_endpoints.js
 */

// ============================================================================
// CONFIGURATION - Update these with your Supabase credentials
// ============================================================================
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const BASE_URL = 'https://samruddhi-backend.onrender.com';

// Test user credentials (will be created if not exists)
const TEST_PATIENT = {
  email: 'test.patient@samruddhi.test',
  password: 'TestPatient@123',
  abhaId: '1234-5678-9012',  // Format: XXXX-XXXX-XXXX
  name: 'Test Patient',
  dob: '1990-05-15',
  gender: 'male',
  phone: '+91-9876543210',
  address: {
    street: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  }
};

const TEST_STAFF = {
  email: 'test.staff@samruddhi.test',
  password: 'TestStaff@123',
  name: 'Dr. Test Staff',
  hospital_id: null // Will be fetched from /hospitals
};

// ============================================================================
// IMPORTS
// ============================================================================
let createClient;
try {
  const supabase = require('@supabase/supabase-js');
  createClient = supabase.createClient;
} catch (error) {
  console.error('❌ ERROR: @supabase/supabase-js not installed!');
  console.error('Run: npm install @supabase/supabase-js');
  process.exit(1);
}

// ============================================================================
// TEST RESULTS
// ============================================================================
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function section(title) {
  console.log('\n' + '='.repeat(70));
  console.log(title);
  console.log('='.repeat(70));
}

async function testEndpoint(name, url, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body;
  const expectStatus = options.expectStatus || [200, 201];
  const expectStatuses = Array.isArray(expectStatus) ? expectStatus : [expectStatus];

  try {
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);
    const status = response.status;
    
    // Clone response before reading body to allow re-reading if needed
    const responseClone = response.clone();
    let data;
    try {
      data = await response.json();
    } catch {
      try {
        data = await responseClone.text();
      } catch {
        data = null;
      }
    }

    if (expectStatuses.includes(status)) {
      results.passed.push(name);
      log('✅', `PASS: ${name} (${status})`);
      return { success: true, status, data };
    } else {
      results.failed.push({ name, status, error: data });
      log('❌', `FAIL: ${name} (${status})`);
      if (typeof data === 'object') {
        log('   ', `Error: ${JSON.stringify(data, null, 2)}`);
      } else if (data && data.error) {
        log('   ', `Error: ${data.error}`);
      }
      return { success: false, status, data };
    }
  } catch (error) {
    results.failed.push({ name, error: error.message });
    log('❌', `ERROR: ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// AUTHENTICATION SETUP
// ============================================================================

async function setupAuth() {
  section('🔐 AUTHENTICATION SETUP');

  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    log('❌', 'SUPABASE credentials not configured!');
    log('ℹ️', 'Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables');
    log('ℹ️', 'Or edit the configuration section at the top of this script');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Get a hospital ID for testing
  log('🏥', 'Fetching hospital for testing...');
  const hospitalsResponse = await fetch(`${BASE_URL}/hospitals?limit=1`);
  const hospitals = await hospitalsResponse.json();
  
  if (!hospitals || hospitals.length === 0) {
    log('❌', 'No hospitals found in database. Please seed hospitals first.');
    process.exit(1);
  }
  
  TEST_STAFF.hospital_id = hospitals[0].id;
  log('✅', `Using hospital: ${hospitals[0].name} (${TEST_STAFF.hospital_id})`);

  // ===== PATIENT AUTHENTICATION =====
  log('👤', 'Setting up patient authentication...');
  
  // Try to sign in first
  let patientAuth = await supabase.auth.signInWithPassword({
    email: TEST_PATIENT.email,
    password: TEST_PATIENT.password
  });

  if (patientAuth.error) {
    // Patient doesn't exist, create one
    log('📝', 'Creating test patient account...');
    patientAuth = await supabase.auth.signUp({
      email: TEST_PATIENT.email,
      password: TEST_PATIENT.password,
      options: {
        data: { role: 'patient' }
      }
    });

    if (patientAuth.error) {
      log('❌', `Failed to create patient: ${patientAuth.error.message}`);
      return null;
    }

    // Wait for user to be created
    await sleep(2000);

    // Sign in again
    patientAuth = await supabase.auth.signInWithPassword({
      email: TEST_PATIENT.email,
      password: TEST_PATIENT.password
    });
  }

  if (!patientAuth.data?.session) {
    log('❌', 'Failed to get patient session');
    return null;
  }

  const patientToken = patientAuth.data.session.access_token;
  const patientUserId = patientAuth.data.user.id;
  log('✅', `Patient authenticated: ${TEST_PATIENT.email}`);
  log('   ', `JWT: ${patientToken.substring(0, 50)}...`);

  // Register patient with backend
  log('📋', 'Registering patient with backend...');
  const registerResult = await testEndpoint(
    'Patient Registration',
    `${BASE_URL}/patients/register`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${patientToken}` },
      body: {
        abhaId: TEST_PATIENT.abhaId,
        name: TEST_PATIENT.name,
        dob: TEST_PATIENT.dob,
        gender: TEST_PATIENT.gender,
        phone: TEST_PATIENT.phone,
        address: TEST_PATIENT.address
      },
      expectStatus: [201, 409] // 409 if already registered
    }
  );

  let patientId = null;
  if (registerResult.success) {
    if (registerResult.data.patient) {
      patientId = registerResult.data.patient.id;
    } else {
      // Already registered, search for patient
      log('🔍', 'Patient already registered, fetching details...');
      const searchResult = await testEndpoint(
        'Search Patient',
        `${BASE_URL}/patients/search?abha_id=${TEST_PATIENT.abhaId}`,
        {
          headers: { 'Authorization': `Bearer ${patientToken}` }
        }
      );
      if (searchResult.success && searchResult.data.patient) {
        patientId = searchResult.data.patient.id;
      }
    }
  }

  if (!patientId) {
    log('❌', 'Could not get patient ID');
    return null;
  }

  log('✅', `Patient ID: ${patientId}`);

  // ===== STAFF AUTHENTICATION =====
  log('👨‍⚕️', 'Setting up hospital staff authentication...');
  
  // Try to sign in first
  let staffAuth = await supabase.auth.signInWithPassword({
    email: TEST_STAFF.email,
    password: TEST_STAFF.password
  });

  if (staffAuth.error) {
    // Staff doesn't exist, create one
    log('📝', 'Creating test staff account...');
    staffAuth = await supabase.auth.signUp({
      email: TEST_STAFF.email,
      password: TEST_STAFF.password,
      options: {
        data: { 
          role: 'hospital_staff',
          hospital_id: TEST_STAFF.hospital_id
        }
      }
    });

    if (staffAuth.error) {
      log('❌', `Failed to create staff: ${staffAuth.error.message}`);
      return null;
    }

    // Wait for user to be created
    await sleep(2000);

    // Sign in again
    staffAuth = await supabase.auth.signInWithPassword({
      email: TEST_STAFF.email,
      password: TEST_STAFF.password
    });
  }

  if (!staffAuth.data?.session) {
    log('❌', 'Failed to get staff session');
    return null;
  }

  const staffToken = staffAuth.data.session.access_token;
  const staffUserId = staffAuth.data.user.id;
  log('✅', `Staff authenticated: ${TEST_STAFF.email}`);
  log('   ', `JWT: ${staffToken.substring(0, 50)}...`);

  return {
    patientToken,
    patientUserId,
    patientId,
    staffToken,
    staffUserId,
    hospitalId: TEST_STAFF.hospital_id
  };
}

// ============================================================================
// TEST SUITES
// ============================================================================

async function testPatientEndpoints(auth) {
  section('👤 PATIENT ENDPOINTS');

  // Search patient
  await testEndpoint(
    'Search Patient by ABHA',
    `${BASE_URL}/patients/search?abha_id=${TEST_PATIENT.abhaId}`,
    {
      headers: { 'Authorization': `Bearer ${auth.patientToken}` }
    }
  );

  // List my consents
  await testEndpoint(
    'List My Consents',
    `${BASE_URL}/consent/my`,
    {
      headers: { 'Authorization': `Bearer ${auth.patientToken}` }
    }
  );

  return auth;
}

async function testConsentFlow(auth) {
  section('🤝 CONSENT FLOW');

  // Grant consent
  const grantResult = await testEndpoint(
    'Grant Consent to Hospital',
    `${BASE_URL}/consent/grant`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.patientToken}` },
      body: {
        patientId: auth.patientUserId, // Supabase auth user ID, not patient record ID
        recipientId: auth.staffUserId, // Staff user ID who will access EHR
        recipientHospitalId: auth.hospitalId,
        scope: ['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices'],
        durationDays: 7
      }
    }
  );

  let consentId = null;
  let consentToken = null;

  if (grantResult.success && grantResult.data) {
    consentId = grantResult.data.consentId;
    consentToken = grantResult.data.consentToken;
    log('✅', `Consent granted: ${consentId}`);
    log('   ', `Consent token: ${consentToken ? consentToken.substring(0, 50) + '...' : 'N/A'}`);

    // Get QR code
    await testEndpoint(
      'Get Consent QR Code',
      `${BASE_URL}/consent/${consentId}/qr?token=${encodeURIComponent(consentToken)}`,
      {
        headers: { 'Authorization': `Bearer ${auth.patientToken}` }
      }
    );

    // Check consent status (public)
    await testEndpoint(
      'Check Consent Status (Public)',
      `${BASE_URL}/consent/status/${consentId}`,
      {}
    );
  }

  return { ...auth, consentId, consentToken };
}

async function testStaffEndpoints(auth) {
  section('👨‍⚕️ HOSPITAL STAFF ENDPOINTS');

  // View received consents
  await testEndpoint(
    'View Received Consents',
    `${BASE_URL}/consent/received?hospitalId=${auth.hospitalId}`,
    {
      headers: { 'Authorization': `Bearer ${auth.staffToken}` }
    }
  );

  // Request consent
  if (auth.patientId) {
    await testEndpoint(
      'Request Consent from Patient',
      `${BASE_URL}/consent/request`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.staffToken}` },
        body: {
          patientId: auth.patientId,
          recipientId: auth.hospitalId,
          scope: ['profile', 'medical_history', 'prescriptions'],
          purpose: 'follow_up_treatment and diagnostic review'
        }
      }
    );
  }

  return auth;
}

async function testEHREndpoints(auth) {
  section('📋 ELECTRONIC HEALTH RECORDS (EHR)');

  if (!auth.consentToken) {
    log('⚠️', 'Skipping EHR tests - no consent token available');
    results.skipped.push({ name: 'EHR Endpoints', reason: 'No consent token' });
    return auth;
  }

  const ehrHeaders = {
    'Authorization': `Bearer ${auth.staffToken}`,
    'X-Consent-Token': auth.consentToken
  };

  // Get patient profile
  await testEndpoint(
    'Get Patient Profile (EHR)',
    `${BASE_URL}/ehr/patient/${auth.patientId}`,
    { headers: ehrHeaders }
  );

  // Get prescriptions
  await testEndpoint(
    'Get Patient Prescriptions',
    `${BASE_URL}/ehr/patient/${auth.patientId}/prescriptions`,
    { headers: ehrHeaders }
  );

  // Get test reports
  await testEndpoint(
    'Get Patient Test Reports',
    `${BASE_URL}/ehr/patient/${auth.patientId}/test-reports`,
    { headers: ehrHeaders }
  );

  // Get medical history
  await testEndpoint(
    'Get Patient Medical History',
    `${BASE_URL}/ehr/patient/${auth.patientId}/medical-history`,
    { headers: ehrHeaders }
  );

  // Get IoT data
  await testEndpoint(
    'Get Patient IoT Data (Heart Rate)',
    `${BASE_URL}/ehr/patient/${auth.patientId}/iot/heart_rate`,
    { headers: ehrHeaders }
  );

  // Add prescription
  await testEndpoint(
    'Add Prescription',
    `${BASE_URL}/ehr/patient/${auth.patientId}/prescription`,
    {
      method: 'POST',
      headers: ehrHeaders,
      body: {
        date: new Date().toISOString().split('T')[0],
        doctor_name: 'Dr. Test Staff',
        hospital_name: 'Test Hospital',
        medications: [
          {
            name: 'Amoxicillin',
            dosage: '500mg',
            frequency: '3 times daily',
            duration: '7 days',
            notes: 'Take with food'
          }
        ],
        diagnosis: 'Upper respiratory tract infection'
      }
    }
  );

  // Add test report
  await testEndpoint(
    'Add Test Report',
    `${BASE_URL}/ehr/patient/${auth.patientId}/test-report`,
    {
      method: 'POST',
      headers: ehrHeaders,
      body: {
        test_name: 'Complete Blood Count',
        date: new Date().toISOString().split('T')[0],
        lab_name: 'City Lab',
        doctor_name: 'Dr. Test Staff',
        parsed_results: {
          hemoglobin: '14.5 g/dL',
          wbc: '8000/μL',
          platelets: '250000/μL'
        },
        notes: 'All values within normal range'
      }
    }
  );

  // Log IoT reading
  await testEndpoint(
    'Log IoT Reading',
    `${BASE_URL}/ehr/patient/${auth.patientId}/iot-log`,
    {
      method: 'POST',
      headers: ehrHeaders,
      body: {
        device_type: 'heart_rate',
        device_id: 'HR-MONITOR-001',
        value: 72,
        unit: 'bpm',
        context: 'Resting heart rate measurement'
      }
    }
  );

  return auth;
}

async function testAdmissions(auth) {
  section('🏨 ADMISSIONS');

  // Try to fetch an existing available bed first
  log('🛏️', 'Fetching available bed...');
  try {
    const bedsResponse = await fetch(`${BASE_URL}/beds?hospitalId=${auth.hospitalId}&status=available&limit=1`);
    const beds = await bedsResponse.json();
    var bedId = (beds && beds.length > 0) ? beds[0].id : null;
    
    if (bedId) {
      log('✅', `Using existing bed: ${bedId}`);
    }
  } catch (e) {
    var bedId = null;
  }

  // Create a bed only if none available
  if (!bedId) {
    log('🛏️', 'Creating test bed...');
    const bedResult = await testEndpoint(
      'Create Bed',
      `${BASE_URL}/beds`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.staffToken}` },
        body: {
          hospital_id: auth.hospitalId,
          bed_number: `TEST-BED-${Date.now()}`,
          type: 'general',
          floor_number: 1,
          room_number: 'Test-Room',
          status: 'available'
        },
        expectStatus: [201, 409]
      }
    );

    if (bedResult.success && bedResult.data && bedResult.data.bed) {
      bedId = bedResult.data.bed.id;
      log('✅', `Bed created: ${bedId}`);
    }
  }

  // Try to fetch existing doctor profile first
  log('👨‍⚕️', 'Checking for existing doctor profile...');
  let doctorId = null;
  try {
    const doctorsResponse = await fetch(`${BASE_URL}/doctors?hospitalId=${auth.hospitalId}`);
    const doctors = await doctorsResponse.json();
    const existingDoctor = doctors.find(d => d.user_id === auth.staffUserId);
    if (existingDoctor) {
      doctorId = existingDoctor.id;
      log('✅', `Using existing doctor: ${doctorId}`);
    }
  } catch (e) {
    log('⚠️', 'Could not fetch doctors');
  }

  // Create a doctor profile only if not exists
  if (!doctorId) {
    log('👨‍⚕️', 'Creating test doctor profile...');
    const doctorResult = await testEndpoint(
      'Create Doctor Profile',
      `${BASE_URL}/doctors`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.staffToken}` },
        body: {
          user_id: auth.staffUserId,
          hospital_id: auth.hospitalId,
          name: TEST_STAFF.name,
          license_number: `TEST-DOC-${Date.now()}`,
          specialization: 'General Medicine',
          qualification: ['MBBS', 'MD'],
          is_on_duty: true,
          max_patients: 10
        },
        expectStatus: [201, 409]
      }
    );

    if (doctorResult.success && doctorResult.data && doctorResult.data.doctor) {
      doctorId = doctorResult.data.doctor.id;
      log('✅', `Doctor profile created: ${doctorId}`);
    } else if (doctorResult.status === 409) {
      // Try fetching again
      log('ℹ️', 'Doctor profile already exists, fetching...');
      const doctorsResponse = await fetch(`${BASE_URL}/doctors?hospitalId=${auth.hospitalId}`);
      const doctors = await doctorsResponse.json();
      const existingDoctor = doctors.find(d => d.user_id === auth.staffUserId);
      if (existingDoctor) {
        doctorId = existingDoctor.id;
        log('✅', `Using existing doctor: ${doctorId}`);
      }
    }
  }

  if (!bedId || !doctorId) {
    log('⚠️', 'Missing bed or doctor - skipping admission tests');
    results.skipped.push({ name: 'Create Admission', reason: 'Missing bed or doctor' });
    return auth;
  }

  // Create admission
  const admissionResult = await testEndpoint(
    'Create Admission',
    `${BASE_URL}/admissions`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth.staffToken}` },
      body: {
        patient_id: auth.patientId,
        hospital_id: auth.hospitalId,
        bed_id: bedId,
        primary_doctor_id: doctorId,
        diagnosis: 'Test diagnosis for endpoint validation',
        admission_type: 'planned'
      }
    }
  );

  let admissionId = null;
  if (admissionResult.success && admissionResult.data.admission) {
    admissionId = admissionResult.data.admission.id;
    log('✅', `Admission created: ${admissionId}`);

    // Wait a moment
    await sleep(1000);

    // Discharge patient
    await testEndpoint(
      'Discharge Patient',
      `${BASE_URL}/admissions/${admissionId}/discharge`,
      {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${auth.staffToken}` },
        body: {
          discharge_summary: 'Test completed successfully, patient discharged',
          follow_up_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    );

    // Verify bed is now available
    await sleep(500);
    await testEndpoint(
      'Verify Bed Available After Discharge',
      `${BASE_URL}/beds?hospitalId=${auth.hospitalId}&status=available`,
      {}
    );
  }

  // Clean up: delete test bed
  if (bedId) {
    await testEndpoint(
      'Delete Test Bed',
      `${BASE_URL}/beds/${bedId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${auth.staffToken}` }
      }
    );
  }

  return auth;
}

async function cleanup(auth) {
  section('🧹 CLEANUP');

  if (auth.consentId) {
    log('🗑️', 'Revoking test consent...');
    await testEndpoint(
      'Revoke Consent (Cleanup)',
      `${BASE_URL}/consent/revoke`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth.patientToken}` },
        body: {
          consentId: auth.consentId
        }
      }
    );
  }

  log('✅', 'Cleanup completed');
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 Samruddhi Backend - Authentication Endpoint Testing');
  console.log('📍 Base URL:', BASE_URL);
  console.log('='.repeat(70));

  try {
    // Setup authentication
    const auth = await setupAuth();
    if (!auth) {
      log('❌', 'Authentication setup failed');
      process.exit(1);
    }

    // Run test suites
    await testPatientEndpoints(auth);
    const authWithConsent = await testConsentFlow(auth);
    await testStaffEndpoints(authWithConsent);
    await testEHREndpoints(authWithConsent);
    await testAdmissions(authWithConsent);

    // Cleanup
    await cleanup(authWithConsent);

    // Print summary
    section('📊 TEST SUMMARY');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Skipped: ${results.skipped.length}`);

    if (results.passed.length > 0) {
      console.log('\n✅ PASSED TESTS:');
      results.passed.forEach(name => console.log(`   - ${name}`));
    }

    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.failed.forEach(item => {
        console.log(`   - ${item.name || item}`);
        if (item.status) console.log(`     Status: ${item.status}`);
        if (item.error) console.log(`     Error: ${item.error}`);
      });
    }

    if (results.skipped.length > 0) {
      console.log('\n⚠️  SKIPPED TESTS:');
      results.skipped.forEach(item => {
        console.log(`   - ${item.name}: ${item.reason}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    if (results.failed.length === 0) {
      console.log('✅ All tests completed successfully!');
    } else {
      console.log('⚠️  Some tests failed - review results above');
    }
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
main();
