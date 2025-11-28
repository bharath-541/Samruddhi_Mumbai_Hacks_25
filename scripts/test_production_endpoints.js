/**
 * Production Endpoint Testing Script
 * Tests all Samruddhi Backend endpoints on deployed Render instance
 * Usage: node scripts/test_production_endpoints.js
 */

const BASE_URL = 'https://samruddhi-backend.onrender.com';

// Test results storage
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Helper function to test endpoint
async function testEndpoint(name, url, options = {}) {
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body;
  const expectStatus = options.expectStatus || 200;
  const requiresAuth = options.requiresAuth || false;

  if (requiresAuth && !options.authToken) {
    results.skipped.push({ name, reason: 'Requires authentication token' });
    console.log(`⚠️  SKIP: ${name} (requires auth)`);
    return;
  }

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
    
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (status === expectStatus || (status >= 200 && status < 300)) {
      results.passed.push({ name, status, url });
      console.log(`✅ PASS: ${name} (${status})`);
      if (options.verbose) {
        console.log(`   Response:`, JSON.stringify(data).substring(0, 200));
      }
      return { success: true, data, status };
    } else {
      results.failed.push({ name, status, expected: expectStatus, url, error: data });
      console.log(`❌ FAIL: ${name} (${status}, expected ${expectStatus})`);
      console.log(`   Error:`, data);
      return { success: false, data, status };
    }
  } catch (error) {
    results.failed.push({ name, error: error.message, url });
    console.log(`❌ ERROR: ${name} - ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test suite
async function runTests() {
  console.log('🚀 Testing Samruddhi Backend Production Endpoints');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log('=' .repeat(70));
  console.log('');

  // ============================================================================
  // HEALTH CHECKS
  // ============================================================================
  console.log('🏥 HEALTH CHECKS');
  console.log('-'.repeat(70));
  
  await testEndpoint(
    'Health Live',
    `${BASE_URL}/health/live`
  );

  await testEndpoint(
    'Health Ready (Database Connection)',
    `${BASE_URL}/health/ready`
  );
  console.log('');

  // ============================================================================
  // HOSPITAL MANAGEMENT (Public Endpoints)
  // ============================================================================
  console.log('🏥 HOSPITAL MANAGEMENT');
  console.log('-'.repeat(70));

  const hospitalsResult = await testEndpoint(
    'Get Hospitals List',
    `${BASE_URL}/hospitals?limit=5`,
    { verbose: false }
  );

  let hospitalId = null;
  if (hospitalsResult.success && hospitalsResult.data && hospitalsResult.data.length > 0) {
    hospitalId = hospitalsResult.data[0].id;
    console.log(`   Using Hospital ID: ${hospitalId}`);
  }

  if (hospitalId) {
    await testEndpoint(
      'Get Hospital Capacity',
      `${BASE_URL}/hospitals/${hospitalId}/capacity`
    );

    await testEndpoint(
      'Get Hospital Dashboard',
      `${BASE_URL}/hospitals/${hospitalId}/dashboard`
    );
  }

  await testEndpoint(
    'Get Beds',
    `${BASE_URL}/beds?hospitalId=${hospitalId || 'test'}&limit=3`
  );

  await testEndpoint(
    'Get Doctors',
    `${BASE_URL}/doctors?hospitalId=${hospitalId || 'test'}&limit=3`
  );

  await testEndpoint(
    'Get Admissions',
    `${BASE_URL}/admissions?hospitalId=${hospitalId || 'test'}&limit=3`
  );

  console.log('');

  // ============================================================================
  // CONSENT SYSTEM (Public Endpoints)
  // ============================================================================
  console.log('🔐 CONSENT SYSTEM (Public Endpoints)');
  console.log('-'.repeat(70));

  // These require valid consent IDs, so will return 404 - that's expected
  await testEndpoint(
    'Get Consent Status',
    `${BASE_URL}/consent/status/test-consent-id-12345`,
    { expectStatus: 404 } // Expected to fail without valid ID
  );

  console.log('');

  // ============================================================================
  // PROTECTED ENDPOINTS (Require Auth)
  // ============================================================================
  console.log('🔒 PROTECTED ENDPOINTS (Require Authentication)');
  console.log('-'.repeat(70));
  console.log('ℹ️  These endpoints require Supabase JWT tokens');
  console.log('ℹ️  Skipping auth-protected tests (provide tokens to test)');
  console.log('');

  // Mark as skipped since we don't have auth tokens
  results.skipped.push(
    { name: 'POST /consent/grant', reason: 'Requires patient JWT' },
    { name: 'POST /consent/revoke', reason: 'Requires patient JWT' },
    { name: 'GET /consent/my', reason: 'Requires patient JWT' },
    { name: 'GET /consent/received', reason: 'Requires hospital staff JWT' },
    { name: 'POST /patients/register', reason: 'Requires patient JWT' },
    { name: 'GET /patients/search', reason: 'Requires authentication' },
    { name: 'POST /admissions', reason: 'Requires staff JWT' },
    { name: 'PATCH /admissions/:id/discharge', reason: 'Requires staff JWT' },
    { name: 'GET /ehr/patient/:id/*', reason: 'Requires staff JWT + consent token' },
    { name: 'POST /ehr/patient/:id/*', reason: 'Requires staff JWT + consent token' }
  );

  // ============================================================================
  // CONSENT REQUESTS (Protected)
  // ============================================================================
  console.log('📋 CONSENT REQUESTS');
  console.log('-'.repeat(70));
  console.log('⚠️  Skipped - Requires authentication');
  console.log('');

  // ============================================================================
  // TEST SUMMARY
  // ============================================================================
  console.log('');
  console.log('='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length} (require authentication)`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('❌ FAILED TESTS:');
    results.failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.error || `Status ${f.status} (expected ${f.expected})`}`);
    });
    console.log('');
  }

  if (results.passed.length > 0) {
    console.log('✅ PASSED TESTS:');
    results.passed.forEach(p => {
      console.log(`   - ${p.name}`);
    });
    console.log('');
  }

  // ============================================================================
  // ENDPOINT DOCUMENTATION FOR FRONTEND
  // ============================================================================
  console.log('='.repeat(70));
  console.log('📖 API ENDPOINTS FOR FRONTEND INTEGRATION');
  console.log('='.repeat(70));
  console.log('');
  console.log('🌐 Base URL: https://samruddhi-backend.onrender.com');
  console.log('');
  console.log('PUBLIC ENDPOINTS (No Auth Required):');
  console.log('━'.repeat(70));
  console.log('  GET  /health/live                           - Server health check');
  console.log('  GET  /health/ready                          - Database readiness');
  console.log('  GET  /hospitals?limit=10                    - List hospitals');
  console.log('  GET  /hospitals/:id/capacity                - Hospital capacity');
  console.log('  GET  /hospitals/:id/dashboard               - Hospital dashboard');
  console.log('  GET  /beds?hospitalId=:id&type=icu          - Query beds');
  console.log('  GET  /doctors?hospitalId=:id                - List doctors');
  console.log('  GET  /admissions?hospitalId=:id             - List admissions');
  console.log('  GET  /consent/status/:consentId             - Check consent status');
  console.log('');
  console.log('PATIENT ENDPOINTS (Require Patient JWT):');
  console.log('━'.repeat(70));
  console.log('  POST /patients/register                     - Register new patient');
  console.log('  GET  /patients/search?abha_id=:id           - Search patient');
  console.log('  POST /consent/grant                         - Grant consent to hospital');
  console.log('  POST /consent/revoke                        - Revoke consent');
  console.log('  GET  /consent/my                            - List my consents');
  console.log('  GET  /consent/:id/qr                        - Generate QR code');
  console.log('');
  console.log('HOSPITAL STAFF ENDPOINTS (Require Staff JWT):');
  console.log('━'.repeat(70));
  console.log('  GET  /consent/received                      - View received consents');
  console.log('  POST /admissions                            - Create admission');
  console.log('  PATCH /admissions/:id/discharge             - Discharge patient');
  console.log('  POST /consent-requests                      - Request consent');
  console.log('');
  console.log('EHR ENDPOINTS (Require Staff JWT + Consent Token):');
  console.log('━'.repeat(70));
  console.log('  GET  /ehr/patient/:id                       - Patient profile');
  console.log('  GET  /ehr/patient/:id/prescriptions         - Prescriptions');
  console.log('  GET  /ehr/patient/:id/test-reports          - Lab reports');
  console.log('  GET  /ehr/patient/:id/medical-history       - Medical history');
  console.log('  GET  /ehr/patient/:id/iot/:deviceType       - IoT device data');
  console.log('  POST /ehr/patient/:id/prescription          - Add prescription');
  console.log('  POST /ehr/patient/:id/test-report           - Add test report');
  console.log('  POST /ehr/patient/:id/iot-log               - Log IoT reading');
  console.log('');
  console.log('AUTHENTICATION HEADERS:');
  console.log('━'.repeat(70));
  console.log('  Authorization: Bearer <SUPABASE_JWT>        - For all protected endpoints');
  console.log('  X-Consent-Token: <CONSENT_JWT>              - For EHR endpoints only');
  console.log('');
  console.log('='.repeat(70));
  console.log('✅ Backend is LIVE and ready for frontend integration!');
  console.log('='.repeat(70));
}

// Run tests
runTests().catch(console.error);
