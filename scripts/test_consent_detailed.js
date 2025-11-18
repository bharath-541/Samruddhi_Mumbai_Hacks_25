// Detailed consent testing with full logging
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e.message);
    return {};
  }
}

async function getSupabaseJWT(email, password) {
  console.log(`\n🔐 Logging in as: ${email}`);
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await axios.post(url, {
    email,
    password,
  }, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  });
  const token = res.data.access_token;
  const payload = decodeJwtPayload(token);
  console.log('✓ Login successful');
  console.log('  User ID:', payload.sub);
  console.log('  Email:', payload.email);
  console.log('  Role:', payload.role);
  console.log('  Custom Claims:', {
    hospital_id: payload.hospital_id,
    patient_id: payload.patient_id,
    app_role: payload.app_role
  });
  return { token, payload };
}

async function getHospitals(staffToken) {
  console.log('\n🏥 Fetching hospitals...');
  const res = await axios.get(`${API_BASE_URL}/hospitals?limit=10`, {
    headers: {
      Authorization: `Bearer ${staffToken}`,
    },
  });
  const hospitals = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
  console.log(`✓ Found ${hospitals.length} hospital(s)`);
  if (hospitals.length > 0) {
    hospitals.forEach((h, i) => {
      console.log(`  ${i + 1}. ${h.name} (ID: ${h.id})`);
    });
  }
  return hospitals;
}

async function testConsentGrant() {
  console.log('\n' + '='.repeat(60));
  console.log('CONSENT GRANT TEST - Detailed Logging');
  console.log('='.repeat(60));

  try {
    // 1. Patient login
    const patientCreds = {
      email: 'demo@example.com',
      password: '123456789',
    };
    const { token: patientToken, payload: patientPayload } = await getSupabaseJWT(
      patientCreds.email,
      patientCreds.password
    );

    // 2. Staff login
    const staffCreds = {
      email: 'admin@example.com',
      password: '123456789',
    };
    const { token: staffToken, payload: staffPayload } = await getSupabaseJWT(
      staffCreds.email,
      staffCreds.password
    );

    // 3. Get hospitals
    const hospitals = await getHospitals(staffToken);
    if (hospitals.length === 0) {
      console.error('\n❌ No hospitals found! Please seed a hospital first.');
      return;
    }
    const hospitalId = hospitals[0].id;

    // 4. Prepare consent grant request
    const consentRequest = {
      patientId: patientPayload.sub,
      recipientId: staffPayload.sub,
      recipientHospitalId: hospitalId,
      scope: ['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices'],
      durationDays: 14,
    };

    console.log('\n📝 Consent Grant Request:');
    console.log(JSON.stringify(consentRequest, null, 2));
    console.log('\n🔑 Authorization Token (patient):');
    console.log('  Token length:', patientToken.length);
    console.log('  Token preview:', patientToken.substring(0, 50) + '...');

    // 5. Send consent grant request
    console.log('\n📤 Sending POST /consent/grant...');
    const res = await axios.post(`${API_BASE_URL}/consent/grant`, consentRequest, {
      headers: {
        Authorization: `Bearer ${patientToken}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('\n✅ CONSENT GRANTED SUCCESSFULLY!');
    console.log('Response:', JSON.stringify(res.data, null, 2));

    const consentToken = res.data.consentToken;
    const consentPayload = decodeJwtPayload(consentToken);
    console.log('\n🎫 Consent JWT Decoded:');
    console.log(JSON.stringify(consentPayload, null, 2));

    return {
      patientToken,
      staffToken,
      consentToken,
      consentId: res.data.consentId,
      patientId: patientPayload.sub,
      hospitalId,
    };

  } catch (err) {
    console.error('\n❌ ERROR OCCURRED:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Headers:', JSON.stringify(err.response.headers, null, 2));
      console.error('Data:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.error('No response received');
      console.error('Request:', err.message);
    } else {
      console.error('Error:', err.message);
    }
    throw err;
  }
}

async function testConsentStatus(consentId) {
  console.log('\n' + '='.repeat(60));
  console.log('CONSENT STATUS TEST');
  console.log('='.repeat(60));

  try {
    console.log(`\n📤 Sending GET /consent/status/${consentId}...`);
    const res = await axios.get(`${API_BASE_URL}/consent/status/${consentId}`);
    console.log('\n✅ STATUS RETRIEVED:');
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error('\n❌ ERROR:', err.response?.data || err.message);
    throw err;
  }
}

async function testEHRAccess(patientId, staffToken, consentToken) {
  console.log('\n' + '='.repeat(60));
  console.log('EHR ACCESS TEST');
  console.log('='.repeat(60));

  try {
    console.log(`\n📤 Sending GET /ehr/patient/${patientId}/prescriptions...`);
    console.log('Headers:');
    console.log('  Authorization: Bearer <staff_jwt>');
    console.log('  X-Consent-Token: <consent_jwt>');

    const res = await axios.get(`${API_BASE_URL}/ehr/patient/${patientId}/prescriptions`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'X-Consent-Token': consentToken,
      },
    });
    console.log('\n✅ EHR ACCESS GRANTED:');
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error('\n❌ ERROR:', err.response?.data || err.message);
    throw err;
  }
}

async function testConsentRevoke(consentId, patientToken) {
  console.log('\n' + '='.repeat(60));
  console.log('CONSENT REVOKE TEST');
  console.log('='.repeat(60));

  try {
    console.log(`\n📤 Sending POST /consent/revoke...`);
    console.log('Request:', JSON.stringify({ consentId }, null, 2));

    const res = await axios.post(`${API_BASE_URL}/consent/revoke`, 
      { consentId },
      {
        headers: {
          Authorization: `Bearer ${patientToken}`,
        },
      }
    );
    console.log('\n✅ CONSENT REVOKED:');
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error('\n❌ ERROR:', err.response?.data || err.message);
    throw err;
  }
}

async function testEHRAccessAfterRevoke(patientId, staffToken, consentToken) {
  console.log('\n' + '='.repeat(60));
  console.log('EHR ACCESS AFTER REVOKE TEST (Should Fail)');
  console.log('='.repeat(60));

  try {
    console.log(`\n📤 Sending GET /ehr/patient/${patientId}/prescriptions...`);
    const res = await axios.get(`${API_BASE_URL}/ehr/patient/${patientId}/prescriptions`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'X-Consent-Token': consentToken,
      },
    });
    console.error('\n❌ UNEXPECTED: Access was granted! Should have been blocked.');
    console.error('Response:', JSON.stringify(res.data, null, 2));
    return false;
  } catch (err) {
    if (err.response?.status === 403) {
      console.log('\n✅ CORRECTLY BLOCKED:');
      console.log('Status: 403 Forbidden');
      console.log('Error:', err.response.data);
      return true;
    } else {
      console.error('\n❌ UNEXPECTED ERROR:', err.response?.data || err.message);
      throw err;
    }
  }
}

// Run all tests
(async () => {
  try {
    console.log('\n🚀 Starting Comprehensive Consent Flow Test');
    console.log('API Base URL:', API_BASE_URL);
    console.log('Supabase URL:', SUPABASE_URL);

    // Test 1: Grant consent
    const { patientToken, staffToken, consentToken, consentId, patientId, hospitalId } = await testConsentGrant();

    // Test 2: Check consent status
    await testConsentStatus(consentId);

    // Test 3: Access EHR with consent
    await testEHRAccess(patientId, staffToken, consentToken);

    // Test 4: Revoke consent
    await testConsentRevoke(consentId, patientToken);

    // Test 5: Try accessing EHR after revoke (should fail)
    await testEHRAccessAfterRevoke(patientId, staffToken, consentToken);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    process.exit(0);

  } catch (err) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST SUITE FAILED');
    console.log('='.repeat(60));
    process.exit(1);
  }
})();
