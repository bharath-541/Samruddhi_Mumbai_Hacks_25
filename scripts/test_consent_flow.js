const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
let patientToken = null;
let doctorToken = null;
let patientId = null;
let doctorUserId = null;
let hospitalId = null;
let consentId = null;
let consentToken = null;
let consentRequestId = null;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${colors.reset} ${message}`);
}

function logSuccess(message) { log(colors.green, '✅', message); }
function logError(message) { log(colors.red, '❌', message); }
function logWarning(message) { log(colors.yellow, '⚠️', message); }
function logInfo(message) { log(colors.blue, 'ℹ️', message); }
function logStep(step, message) {
  console.log(`\n${colors.blue}━━━ STEP ${step}: ${message} ━━━${colors.reset}\n`);
}

async function makeRequest(method, endpoint, body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
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

// ============================================================================
// SETUP: Get Patient & Doctor Tokens
// ============================================================================

async function setup() {
  logStep('SETUP', 'Getting Patient and Doctor Authentication Tokens');

  // Get patient token
  logInfo('Registering/logging in patient...');
  const patientRes = await makeRequest('POST', '/auth/register', {
    phone: '+919876543210',
    password: 'Test@1234',
    role: 'patient',
    name: 'Test Patient',
  });

  if (patientRes.ok || patientRes.status === 409) {
    // Try login if already exists
    const loginRes = await makeRequest('POST', '/auth/login', {
      phone: '+919876543210',
      password: 'Test@1234',
    });

    if (loginRes.ok) {
      patientToken = loginRes.data.token;
      patientId = loginRes.data.user.patientId;
      logSuccess(`Patient logged in. ID: ${patientId}`);
    } else {
      logError('Failed to login patient');
      return false;
    }
  }

  // Get doctor token
  logInfo('Registering/logging in doctor...');
  const doctorRes = await makeRequest('POST', '/auth/register', {
    phone: '+919876543211',
    password: 'Test@1234',
    role: 'doctor',
    name: 'Dr. Test Doctor',
  });

  if (doctorRes.ok || doctorRes.status === 409) {
    const loginRes = await makeRequest('POST', '/auth/login', {
      phone: '+919876543211',
      password: 'Test@1234',
    });

    if (loginRes.ok) {
      doctorToken = loginRes.data.token;
      doctorUserId = loginRes.data.user.id;
      hospitalId = loginRes.data.user.hospitalId;
      logSuccess(`Doctor logged in. User ID: ${doctorUserId}, Hospital ID: ${hospitalId}`);
    } else {
      logError('Failed to login doctor');
      return false;
    }
  }

  return patientToken && doctorToken && patientId && doctorUserId;
}

// ============================================================================
// TEST 1: Direct Consent Grant
// ============================================================================

async function testDirectConsentGrant() {
  logStep(1, 'DIRECT CONSENT GRANT');

  logInfo('Patient granting consent to doctor...');
  const response = await makeRequest(
    'POST',
    '/consent/grant',
    {
      patientId: patientId,
      recipientId: doctorUserId,
      recipientHospitalId: hospitalId,
      scope: ['demographics', 'prescriptions', 'test_reports'],
      durationDays: 14,
    },
    patientToken
  );

  if (response.ok) {
    consentId = response.data.consentId;
    consentToken = response.data.consentToken;
    logSuccess('Consent granted successfully!');
    logInfo(`Consent ID: ${consentId}`);
    logInfo(`Consent Token: ${consentToken.substring(0, 50)}...`);
    logInfo(`Expires at: ${response.data.expiresAt}`);
    logInfo(`Scopes: ${response.data.scope.join(', ')}`);
    return true;
  } else {
    logError(`Consent grant failed: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================================================
// TEST 2: Check Consent Status
// ============================================================================

async function testConsentStatus() {
  logStep(2, 'CHECK CONSENT STATUS');

  if (!consentId) {
    logWarning('No consent ID available to check');
    return false;
  }

  logInfo('Checking consent status (public endpoint)...');
  const response = await makeRequest('GET', `/consent/status/${consentId}`);

  if (response.ok) {
    logSuccess('Consent status retrieved!');
    logInfo(`Valid: ${response.data.valid}`);
    logInfo(`Revoked: ${response.data.revoked}`);
    logInfo(`Expired: ${response.data.expired}`);
    logInfo(`Scopes: ${response.data.scope.join(', ')}`);
    logInfo(`Patient ID: ${response.data.patientId}`);
    logInfo(`Recipient ID: ${response.data.recipientId}`);
    return response.data.valid;
  } else {
    logError(`Status check failed: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================================================
// TEST 3: Access Patient EHR with Consent
// ============================================================================

async function testAccessEHRWithConsent() {
  logStep(3, 'ACCESS PATIENT EHR WITH CONSENT TOKEN');

  if (!consentToken || !patientId) {
    logWarning('No consent token or patient ID available');
    return false;
  }

  logInfo('Doctor accessing patient EHR with consent...');
  const response = await fetch(`${BASE_URL}/ehr/patient/${patientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'X-Consent-Token': consentToken,
    },
  });

  const data = await response.json();

  if (response.ok) {
    logSuccess('EHR accessed successfully with consent!');
    logInfo(`Access: ${data.access}`);
    logInfo(`Patient ID: ${data.patientId}`);
    logInfo(`Scopes: ${data.scopes.join(', ')}`);
    if (data.ehr) {
      logInfo(`EHR Data Available: ${Object.keys(data.ehr).length} fields`);
    }
    return true;
  } else {
    logError(`EHR access failed: ${JSON.stringify(data)}`);
    return false;
  }
}

// ============================================================================
// TEST 4: Access EHR WITHOUT Consent (Should Fail)
// ============================================================================

async function testAccessEHRWithoutConsent() {
  logStep(4, 'ACCESS PATIENT EHR WITHOUT CONSENT (Should Fail)');

  if (!patientId) {
    logWarning('No patient ID available');
    return false;
  }

  logInfo('Doctor trying to access EHR without consent token...');
  const response = await makeRequest(
    'GET',
    `/ehr/patient/${patientId}`,
    null,
    doctorToken
  );

  if (!response.ok && response.status === 401) {
    logSuccess('✅ Correctly rejected access without consent token!');
    return true;
  } else {
    logError('❌ Security issue: EHR accessible without consent!');
    return false;
  }
}

// ============================================================================
// TEST 5: Revoke Consent
// ============================================================================

async function testRevokeConsent() {
  logStep(5, 'REVOKE CONSENT');

  if (!consentId) {
    logWarning('No consent ID to revoke');
    return false;
  }

  logInfo('Patient revoking consent...');
  const response = await makeRequest(
    'POST',
    '/consent/revoke',
    { consentId: consentId },
    patientToken
  );

  if (response.ok) {
    logSuccess('Consent revoked successfully!');
    logInfo(`Revoked: ${response.data.revoked}`);
    return true;
  } else {
    logError(`Revoke failed: ${JSON.stringify(response.data)}`);
    return false;
  }
}

// ============================================================================
// TEST 6: Try Access with Revoked Consent (Should Fail)
// ============================================================================

async function testAccessWithRevokedConsent() {
  logStep(6, 'ACCESS EHR WITH REVOKED CONSENT (Should Fail)');

  if (!consentToken || !patientId) {
    logWarning('No consent token or patient ID available');
    return false;
  }

  logInfo('Doctor trying to access EHR with revoked consent...');
  const response = await fetch(`${BASE_URL}/ehr/patient/${patientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'X-Consent-Token': consentToken,
    },
  });

  const data = await response.json();

  if (!response.ok && response.status === 403) {
    logSuccess('✅ Correctly rejected revoked consent!');
    logInfo(`Error: ${data.error}`);
    return true;
  } else {
    logError('❌ Security issue: Revoked consent still works!');
    return false;
  }
}

// ============================================================================
// TEST 7: Consent Request Workflow
// ============================================================================

async function testConsentRequestWorkflow() {
  logStep(7, 'CONSENT REQUEST WORKFLOW (Doctor Requests → Patient Approves)');

  // Doctor creates consent request
  logInfo('Doctor requesting consent from patient...');
  const requestRes = await makeRequest(
    'POST',
    '/consent/request',
    {
      patientId: patientId,
      scope: ['demographics', 'medical_history', 'iot_data'],
      purpose: 'Follow-up consultation',
    },
    doctorToken
  );

  if (requestRes.ok) {
    consentRequestId = requestRes.data.request.id;
    logSuccess('Consent request created!');
    logInfo(`Request ID: ${consentRequestId}`);
    logInfo(`Status: ${requestRes.data.request.status}`);
  } else {
    logError(`Request creation failed: ${JSON.stringify(requestRes.data)}`);
    return false;
  }

  // Patient views their requests
  logInfo('\nPatient viewing consent requests...');
  const viewRes = await makeRequest('GET', '/consent/requests/my', null, patientToken);

  if (viewRes.ok) {
    logSuccess(`Found ${viewRes.data.requests.length} consent request(s)`);
    const pendingRequests = viewRes.data.requests.filter(r => r.status === 'pending');
    logInfo(`Pending requests: ${pendingRequests.length}`);
  } else {
    logError(`Failed to fetch requests: ${JSON.stringify(viewRes.data)}`);
  }

  // Patient approves the request
  logInfo('\nPatient approving consent request...');
  const approveRes = await makeRequest(
    'POST',
    `/consent/requests/${consentRequestId}/approve`,
    null,
    patientToken
  );

  if (approveRes.ok) {
    logSuccess('Consent request approved!');
    logInfo(`New Consent ID: ${approveRes.data.consentId}`);
    logInfo(`Consent Token: ${approveRes.data.consentToken.substring(0, 50)}...`);
    logInfo(`Expires at: ${approveRes.data.expiresAt}`);
    
    // Update tokens for further testing
    consentId = approveRes.data.consentId;
    consentToken = approveRes.data.consentToken;
    return true;
  } else {
    logError(`Approval failed: ${JSON.stringify(approveRes.data)}`);
    return false;
  }
}

// ============================================================================
// TEST 8: Scope Validation
// ============================================================================

async function testScopeValidation() {
  logStep(8, 'SCOPE VALIDATION (Access with insufficient scope)');

  if (!consentToken || !patientId) {
    logWarning('No consent token or patient ID available');
    return false;
  }

  // Current consent has: demographics, medical_history, iot_data
  // Try to access prescriptions (not in scope)
  logInfo('Doctor trying to access prescriptions (not in consent scope)...');
  const response = await fetch(`${BASE_URL}/ehr/patient/${patientId}/prescriptions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'X-Consent-Token': consentToken,
    },
  });

  const data = await response.json();

  if (!response.ok && response.status === 403) {
    logSuccess('✅ Correctly rejected access to out-of-scope data!');
    logInfo(`Error: ${data.error}`);
    return true;
  } else {
    logError('❌ Security issue: Access granted outside consent scope!');
    return false;
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('🔐 CONSENT SYSTEM - COMPREHENSIVE TEST SUITE');
  console.log('═'.repeat(70));

  const setupSuccess = await setup();
  if (!setupSuccess) {
    logError('Setup failed! Cannot continue tests.');
    process.exit(1);
  }

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: 'Direct Consent Grant', fn: testDirectConsentGrant },
    { name: 'Check Consent Status', fn: testConsentStatus },
    { name: 'Access EHR with Consent', fn: testAccessEHRWithConsent },
    { name: 'Access EHR without Consent', fn: testAccessEHRWithoutConsent },
    { name: 'Revoke Consent', fn: testRevokeConsent },
    { name: 'Access with Revoked Consent', fn: testAccessWithRevokedConsent },
    { name: 'Consent Request Workflow', fn: testConsentRequestWorkflow },
    { name: 'Scope Validation', fn: testScopeValidation },
  ];

  for (const test of tests) {
    results.total++;
    try {
      const success = await test.fn();
      if (success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      results.failed++;
      logError(`Test "${test.name}" threw error: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(70));
  console.log(`Total Tests: ${results.total}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(
    `Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`
  );
  console.log('═'.repeat(70) + '\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
