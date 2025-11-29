const BASE_URL = process.env.API_URL || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function logSuccess(message) { log(colors.green, '✅', message); }
function logError(message) { log(colors.red, '❌', message); }
function logInfo(message) { log(colors.blue, 'ℹ️', message); }
function logStep(step, message) {
  console.log(`\n${colors.blue}━━━ STEP ${step}: ${message} ━━━${colors.reset}\n`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return { ok: false, status: 0, data: { error: error.message } };
  }
}

async function testDoctorFlow() {
  console.log('\n' + '═'.repeat(70));
  console.log('👨‍⚕️ DOCTOR AUTHENTICATION & PRESCRIPTION FLOW TEST');
  console.log('═'.repeat(70));

  let doctorToken = null;
  let doctorId = null;
  let hospitalId = null;
  let patientId = null;

  // Step 1: Get a hospital ID
  logStep(1, 'FETCH A HOSPITAL ID');
  const hospitalsRes = await makeRequest('GET', '/hospitals?limit=1');
  
  if (hospitalsRes.ok && hospitalsRes.data.hospitals?.length > 0) {
    hospitalId = hospitalsRes.data.hospitals[0].id;
    logSuccess(`Found hospital: ${hospitalsRes.data.hospitals[0].name} (${hospitalId})`);
  } else {
    logError('No hospitals found. Please seed hospitals first.');
    return false;
  }

  // Step 2: Register doctor
  logStep(2, 'REGISTER NEW DOCTOR');
  const timestamp = Date.now();
  const doctorEmail = `doctor-${timestamp}@test.com`;
  
  const signupRes = await makeRequest('POST', '/auth/doctor/signup', {
    email: doctorEmail,
    password: 'Doctor@123',
    name: 'Dr. Test Doctor',
    hospitalId: hospitalId,
    specialization: 'General Medicine',
    licenseNumber: 'MED12345',
    phone: '+919876543210'
  });

  if (signupRes.ok) {
    logSuccess('Doctor registration successful!');
    logInfo(`Doctor Email: ${doctorEmail}`);
  } else if (signupRes.status === 409) {
    logInfo('Doctor already exists, will try login...');
  } else {
    logError(`Doctor registration failed: ${JSON.stringify(signupRes.data)}`);
    return false;
  }

  // Step 3: Login doctor
  logStep(3, 'DOCTOR LOGIN');
  const loginRes = await makeRequest('POST', '/auth/doctor/login', {
    email: doctorEmail,
    password: 'Doctor@123'
  });

  if (loginRes.ok) {
    doctorToken = loginRes.data.session.access_token;
    doctorId = loginRes.data.doctor.id;
    logSuccess('Doctor login successful!');
    logInfo(`Doctor ID: ${doctorId}`);
    logInfo(`Hospital: ${loginRes.data.doctor.hospital.name}`);
    logInfo(`Token: ${doctorToken.substring(0, 50)}...`);
  } else {
    logError(`Doctor login failed: ${JSON.stringify(loginRes.data)}`);
    return false;
  }

  // Step 4: Get or create a patient
  logStep(4, 'GET TEST PATIENT');
  const patientSignupRes = await makeRequest('POST', '/auth/patient/signup', {
    email: `patient-${timestamp}@test.com`,
    password: 'Patient@123',
    name: 'Test Patient',
    dob: '1990-01-01',
    gender: 'male',
    bloodGroup: 'O+',
    phone: '+919876543211',
    address: {
      street: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    }
  });

  if (patientSignupRes.ok) {
    patientId = patientSignupRes.data.patient.id;
    logSuccess(`Patient created: ${patientId}`);
  } else {
    logError(`Patient creation failed: ${JSON.stringify(patientSignupRes.data)}`);
    // Try to find an existing patient
    const searchRes = await makeRequest('GET', '/patients/search?abha_id=AUTO-12345678-1234');
    if (searchRes.ok && searchRes.data.found) {
      patientId = searchRes.data.patient.id;
      logInfo(`Using existing patient: ${patientId}`);
    } else {
      logError('No patient available for testing');
      return false;
    }
  }

  // Step 5: Doctor adds prescription to patient
  logStep(5, 'DOCTOR ADDS PRESCRIPTION TO PATIENT');
  const prescriptionRes = await makeRequest(
    'POST',
    `/ehr/doctor/patient/${patientId}/prescription`,
    {
      date: new Date().toISOString().split('T')[0],
      doctor_name: 'Dr. Test Doctor',
      hospital_name: 'Test Hospital',
      medications: [
        {
          name: 'Amoxicillin',
          dosage: '500mg',
          frequency: 'Three times daily',
          duration: '7 days',
          notes: 'Take with food'
        }
      ],
      diagnosis: 'Upper respiratory infection',
      notes: 'Follow-up in 1 week if symptoms persist'
    },
    doctorToken
  );

  if (prescriptionRes.ok) {
    logSuccess('Prescription added successfully by doctor!');
    logInfo(`Prescription created at: ${prescriptionRes.data.prescription.created_at}`);
    logInfo(`Source: ${prescriptionRes.data.prescription.source.type}`);
  } else {
    logError(`Failed to add prescription: ${JSON.stringify(prescriptionRes.data)}`);
    return false;
  }

  // Step 6: Doctor adds test report
  logStep(6, 'DOCTOR ADDS TEST REPORT TO PATIENT');
  const testReportRes = await makeRequest(
    'POST',
    `/ehr/doctor/patient/${patientId}/test-report`,
    {
      test_name: 'Complete Blood Count (CBC)',
      date: new Date().toISOString().split('T')[0],
      lab_name: 'Test Lab',
      doctor_name: 'Dr. Test Doctor',
      parsed_results: {
        'WBC': '8.5 x10^9/L',
        'RBC': '5.2 x10^12/L',
        'Hemoglobin': '14.5 g/dL',
        'Platelets': '250 x10^9/L'
      },
      notes: 'All values within normal range'
    },
    doctorToken
  );

  if (testReportRes.ok) {
    logSuccess('Test report added successfully by doctor!');
  } else {
    logError(`Failed to add test report: ${JSON.stringify(testReportRes.data)}`);
    return false;
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(70));
  logSuccess('Doctor registration: PASSED');
  logSuccess('Doctor login: PASSED');
  logSuccess('Add prescription: PASSED');
  logSuccess('Add test report: PASSED');
  console.log('\n' + colors.green + '🎉 ALL TESTS PASSED!' + colors.reset);
  console.log('═'.repeat(70) + '\n');

  return true;
}

testDoctorFlow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
