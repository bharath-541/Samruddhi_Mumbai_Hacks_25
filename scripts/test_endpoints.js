// test_endpoints.js
// Script to test Samruddhi API endpoints for both patient and admin (staff)
// Usage: node test_endpoints.js

const axios = require('axios');

require('dotenv').config({ path: '.env.local' });
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const HOSPITAL_ID = process.env.HOSPITAL_ID; // set this in .env.local

function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonPayload);
  } catch (e) {
    return {};
  }
}

function printAxiosError(err, label = 'Request') {
  if (err.response) {
    console.error(`${label} failed: ${err.response.status}`);
    console.error('Response headers:', err.response.headers);
    console.error('Response data:', err.response.data);
  } else if (err.request) {
    console.error(`${label} no response received`);
    console.error(err.message);
  } else {
    console.error(`${label} error:`, err.message);
  }
}

async function resolveHospitalId(staffToken) {
  if (HOSPITAL_ID) return HOSPITAL_ID;
  try {
    // Try listing hospitals from API and pick the first active
    const res = await axios.get(`${API_BASE_URL}/hospitals?limit=1`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
      },
    });
    const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
    const first = list[0];
    if (first?.id) {
      console.log('Resolved HOSPITAL_ID from API:', first.id);
      return first.id;
    }
    // No hospitals exist; attempt to create one using service role key
    if (!SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE) {
      throw new Error('No hospitals found and missing service role key to seed one');
    }
    console.log('No hospitals found. Seeding default hospital...');
    const seedRes = await axios.post(
      `${SUPABASE_URL}/rest/v1/hospitals`,
      {
        name: 'Demo General Hospital',
        type: 'private',
        tier: 'secondary',
        address: { city: 'Demo City' },
        is_active: true,
        capacity_summary: {}
      },
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation'
        }
      }
    );
    const created = seedRes.data && seedRes.data[0];
    if (created?.id) {
      console.log('Seeded hospital id:', created.id);
      return created.id;
    }
    throw new Error('Hospital seed failed');
  } catch (err) {
    printAxiosError(err, 'Resolve hospital');
    throw new Error('Unable to resolve HOSPITAL_ID. Set it in .env.local');
  }
}

const patientCreds = {
  email: 'demo@example.com',
  password: '123456789',
};

const staffCreds = {
  email: 'admin@example.com', // Change to your staff/admin email
  password: '123456789',  // Change to your staff/admin password
};

async function getSupabaseJWT(email, password) {
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
  return res.data.access_token;
}

async function grantConsent(patientToken, patientId, staffToken, staffSub) {
  // Grant consent for all scopes for 14 days
  const hospitalId = await resolveHospitalId(staffToken);
  try {
    const res = await axios.post(`${API_BASE_URL}/consent/grant`, {
      patientId: patientId,
      recipientId: staffSub,
      recipientHospitalId: hospitalId,
      scope: ['profile', 'medical_history', 'prescriptions', 'test_reports', 'iot_devices'],
      durationDays: 14,
    }, {
      headers: {
        Authorization: `Bearer ${patientToken}`,
      },
    });
    return res.data.consentToken;
  } catch (err) {
    printAxiosError(err, 'Consent grant');
    throw err;
  }
}

async function testEndpoints() {
  // 1. Patient login
  console.log('Logging in as patient...');
  const patientToken = await getSupabaseJWT(patientCreds.email, patientCreds.password);
  console.log('Patient JWT:', patientToken);
  const patientPayload = decodeJwtPayload(patientToken);
  const patientSub = patientPayload.sub;
  if (!patientSub) {
    throw new Error('Could not decode patient sub from JWT');
  }

  // 2. Staff login
  console.log('Logging in as staff...');
  const staffToken = await getSupabaseJWT(staffCreds.email, staffCreds.password);
  console.log('Staff JWT:', staffToken);
  const staffPayload = decodeJwtPayload(staffToken);
  const staffSub = staffPayload.sub;
  if (!staffSub) throw new Error('Could not decode staff sub from JWT');

  // 3. Get patient ID (from JWT or API)
  // For demo, you may hardcode or decode from JWT
  const patientId = process.env.PATIENT_ID || patientSub; // prefer env override, else use auth user id

  // 4. Grant consent (patient side)
  console.log('Granting consent...');
  const consentToken = await grantConsent(patientToken, patientId, staffToken, staffSub);
  console.log('Consent JWT:', consentToken);

  // 5. Test EHR read endpoint (staff side)
  console.log('Testing EHR read endpoint...');
  try {
    const ehrRes = await axios.get(`${API_BASE_URL}/ehr/patient/${patientId}/prescriptions`, {
      headers: {
        Authorization: `Bearer ${staffToken}`,
        'X-Consent-Token': consentToken,
      },
    });
    console.log('EHR prescriptions:', ehrRes.data);
  } catch (err) {
    printAxiosError(err, 'EHR read prescriptions');
  }

  // 6. Test hospital dashboard (admin side)
  console.log('Testing hospital dashboard...');
  try {
    const hospitalId = await resolveHospitalId(staffToken);
    try {
      const dashboardRes = await axios.get(`${API_BASE_URL}/hospitals/${hospitalId}/dashboard`, {
        headers: {
          Authorization: `Bearer ${staffToken}`,
        },
      });
      console.log('Dashboard:', dashboardRes.data);
    } catch (err) {
      printAxiosError(err, 'Hospital dashboard');
    }
  } catch (_) {
    console.warn('Skipping dashboard test: could not resolve HOSPITAL_ID');
  }

  // Add more endpoint tests as needed...
}

// Run the test
(async () => {
  try {
    console.log('SUPABASE_URL:', SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);
    await testEndpoints();
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
})();
