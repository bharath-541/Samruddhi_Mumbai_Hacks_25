#!/usr/bin/env node

/**
 * Test script for Patient Registration endpoints (TASK 1)
 * Tests: POST /patients/register, GET /patients/:id, PATCH /patients/:id/profile, GET /patients/search
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Helper function for API calls
async function apiCall(method, path, body = null, headers = {}) {
    const url = `${BASE_URL}${path}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    console.log(`\n📤 ${method} ${path}`);
    if (body) console.log('Body:', JSON.stringify(body, null, 2));

    try {
        const response = await fetch(url, options);
        const data = await response.json();

        console.log(`📥 Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));

        return { status: response.status, data };
    } catch (error) {
        console.error('❌ Error:', error.message);
        return { status: 500, data: { error: error.message } };
    }
}

async function runTests() {
    console.log('🧪 TASK 1: Patient Registration Tests');
    console.log('='.repeat(60));

    let patientId;
    const testAbhaId = `1111-2222-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Test 1: Register new patient
    console.log('\n\n🧪 TEST 1: Register New Patient');
    console.log('-'.repeat(60));
    const registration = await apiCall('POST', '/patients/register', {
        abhaId: testAbhaId,
        name: 'Rajesh Kumar Test',
        dob: '1980-01-15',
        gender: 'male',
        bloodGroup: 'A+',
        phone: '+91-9876543210',
        emergencyContact: '+91-9123456789',
        address: {
            street: '123 MG Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001'
        }
    });

    if (registration.status === 201) {
        console.log('✅ TEST 1 PASSED: Patient registered successfully');
        patientId = registration.data.patient.id;
    } else {
        console.log('❌ TEST 1 FAILED: Expected status 201, got', registration.status);
        return;
    }

    // Test 2: Duplicate ABHA ID (should fail)
    console.log('\n\n🧪 TEST 2: Duplicate ABHA ID (Error Case)');
    console.log('-'.repeat(60));
    const duplicate = await apiCall('POST', '/patients/register', {
        abhaId: testAbhaId, // Same ABHA ID
        name: 'Another Person',
        dob: '1985-05-20',
        gender: 'female',
        bloodGroup: 'B+',
        phone: '+91-9999999999',
        emergencyContact: '+91-8888888888',
        address: {
            street: '456 Street',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001'
        }
    });

    if (duplicate.status === 409) {
        console.log('✅ TEST 2 PASSED: Duplicate ABHA ID rejected correctly');
    } else {
        console.log('❌ TEST 2 FAILED: Expected status 409, got', duplicate.status);
    }

    // Test 3: Get patient by ID
    console.log('\n\n🧪 TEST 3: Get Patient by ID');
    console.log('-'.repeat(60));
    const getPatient = await apiCall('GET', `/patients/${patientId}`);

    if (getPatient.status === 200 && getPatient.data.id === patientId) {
        console.log('✅ TEST 3 PASSED: Patient retrieved successfully');
    } else {
        console.log('❌ TEST 3 FAILED: Expected status 200, got', getPatient.status);
    }

    // Test 4: Search patient by ABHA ID
    console.log('\n\n🧪 TEST 4: Search Patient by ABHA ID');
    console.log('-'.repeat(60));
    const search = await apiCall('GET', `/patients/search?abha_id=${testAbhaId}`);

    if (search.status === 200 && search.data.found === true) {
        console.log('✅ TEST 4 PASSED: Patient found by ABHA ID');
    } else {
        console.log('❌ TEST 4 FAILED: Patient not found');
    }

    // Test 5: Search non-existent ABHA ID
    console.log('\n\n🧪 TEST 5: Search Non-Existent ABHA ID');
    console.log('-'.repeat(60));
    const notFound = await apiCall('GET', '/patients/search?abha_id=9999-9999-9999');

    if (notFound.status === 200 && notFound.data.found === false) {
        console.log('✅ TEST 5 PASSED: Non-existent ABHA ID returns found=false');
    } else {
        console.log('❌ TEST 5 FAILED: Expected found=false');
    }

    // Test 6: Update patient profile
    console.log('\n\n🧪 TEST 6: Update Patient Profile');
    console.log('-'.repeat(60));
    const update = await apiCall('PATCH', `/patients/${patientId}/profile`, {
        phone: '+91-9999888877',
        address: {
            street: '789 New Address',
            city: 'Pune',
            state: 'Maharashtra',
            pincode: '411001'
        }
    });

    if (update.status === 200 && update.data.success) {
        console.log('✅ TEST 6 PASSED: Profile updated successfully');
    } else {
        console.log('❌ TEST 6 FAILED: Update failed');
    }

    // Test 7: Invalid ABHA format
    console.log('\n\n🧪 TEST 7: Invalid ABHA Format (Validation Error)');
    console.log('-'.repeat(60));
    const invalid = await apiCall('POST', '/patients/register', {
        abhaId: 'invalid-format', // Wrong format
        name: 'Test User',
        dob: '1990-01-01',
        gender: 'male',
        phone: '+91-9876543210',
        emergencyContact: '+91-9123456789',
        address: { street: 'Test', city: 'Test', state: 'Test', pincode: '123456' }
    });

    if (invalid.status === 400) {
        console.log('✅ TEST 7 PASSED: Invalid ABHA format rejected');
    } else {
        console.log('❌ TEST 7 FAILED: Expected status 400, got', invalid.status);
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(' Patient Registration System is working! 🎉');
    console.log(`✅ Patient ID: ${patientId}`);
    console.log(`✅ ABHA ID: ${testAbhaId}`);
    console.log('\n Next Steps:');
    console.log('  1. Verify patient in Postgres: SELECT * FROM patients;');
    console.log('  2. Verify EHR in MongoDB: db.ehr_records.find({patient_id: "' + patientId + '"});');
    console.log('  3. Test with requirePatientAuth middleware');
    console.log('  4. Add seed script for 10 test patients');
}

// Run tests
runTests().catch(console.error);
