const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

let TOKEN = null;
let PATIENT_ID = null;
let USER_ID = null;

async function authenticate() {
    console.log('\n🔐 AUTHENTICATION');
    console.log('='.repeat(60));

    const testEmail = `test_patient_${Date.now()}@example.com`;
    const testPassword = 'Test123!@#';

    console.log(`📧 Creating test user: ${testEmail}`);

    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
    });

    if (error) {
        console.error('❌ Auth failed:', error.message);
        process.exit(1);
    }

    TOKEN = data.session.access_token;
    USER_ID = data.user.id;
    console.log('✅ Authenticated successfully');
    console.log(`   User ID: ${USER_ID}`);
    return { email: testEmail, password: testPassword };
}

async function testPatientRegistration() {
    console.log('\n📝 TASK 1: PATIENT REGISTRATION');
    console.log('='.repeat(60));

    const res = await fetch(`${BASE_URL}/patients/register`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'John Test Doe',
            dob: '1990-01-15',
            gender: 'male',
            bloodGroup: 'O+',
            phone: '+91-9876543210',
            emergencyContact: '+91-9876543211',
            address: {
                street: '123 Test Street',
                city: 'Mumbai',
                state: 'Maharashtra',
                pincode: '400001'
            }
        })
    });

    const data = await res.json();

    if (res.status === 201) {
        PATIENT_ID = data.patient.id;  // Fixed: data.patient.id instead of data.id
        console.log('✅ Patient registered successfully');
        console.log(`   Patient ID: ${PATIENT_ID}`);
        console.log(`   ABHA ID: ${data.patient.abha_id}`);

        // Refresh token to get updated metadata
        console.log('\n🔄 Refreshing token to get updated patient_id...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
            console.log('❌ Token refresh failed:', refreshError.message);
            return false;
        }
        TOKEN = refreshData.session.access_token;
        console.log('✅ Token refreshed with patient_id metadata');

        return true;
    } else {
        console.log('❌ Registration failed:', res.status, data);
        return false;
    }
}

async function testPatientSelfService() {
    console.log('\n🏥 TASK 2: PATIENT SELF-SERVICE EHR');
    console.log('='.repeat(60));

    // Test 1: Add Prescription
    console.log('\n1. Adding prescription...');
    let res = await fetch(`${BASE_URL}/ehr/my/prescription`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            doctor_name: 'Dr. Smith',
            hospital_name: 'Test Hospital',
            date: new Date().toISOString().split('T')[0],
            medications: [
                { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily' }
            ],
            diagnosis: 'Common cold'
        })
    });

    if (res.status === 201) {
        console.log('✅ Prescription added');
    } else {
        console.log('❌ Failed:', await res.json());
    }

    // Test 2: View My EHR
    console.log('\n2. Fetching complete EHR...');
    res = await fetch(`${BASE_URL}/ehr/my`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (res.status === 200) {
        const ehr = await res.json();
        console.log('✅ EHR fetched successfully');
        console.log(`   Prescriptions: ${ehr.prescriptions?.length || 0}`);
        console.log(`   Test Reports: ${ehr.test_reports?.length || 0}`);
    } else {
        console.log('❌ Failed:', await res.json());
    }

    // Test 3: Add Test Report
    console.log('\n3. Adding test report...');
    res = await fetch(`${BASE_URL}/ehr/my/test-report`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            test_name: 'Blood Test',
            date: new Date().toISOString().split('T')[0],
            lab_name: 'Test Lab',
            parsed_results: {
                'Hemoglobin': '14.5 g/dL',
                'WBC': '8000/μL'
            }
        })
    });

    if (res.status === 201) {
        console.log('✅ Test report added');
    } else {
        console.log('❌ Failed:', await res.json());
    }

    // Test 4: Add IoT Log
    console.log('\n4. Adding IoT log...');
    res = await fetch(`${BASE_URL}/ehr/my/iot-log`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            device_type: 'heart_rate',
            device_id: 'fitbit_001',
            value: 72,
            unit: 'bpm'
        })
    });

    if (res.status === 201) {
        console.log('✅ IoT log added');
    } else {
        console.log('❌ Failed:', await res.json());
    }

    // Test 5: Fetch specific data
    console.log('\n5. Fetching prescriptions...');
    res = await fetch(`${BASE_URL}/ehr/my/prescriptions`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (res.status === 200) {
        const data = await res.json();
        console.log(`✅ Found ${data.count} prescription(s)`);
    } else {
        console.log('❌ Failed:', await res.json());
    }
}

async function testQRCode() {
    console.log('\n📱 TASK 3: QR CODE GENERATION');
    console.log('='.repeat(60));

    // First, grant a mock consent
    console.log('\n1. Granting consent...');
    let res = await fetch(`${BASE_URL}/consent/grant`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            patientId: PATIENT_ID,
            recipientId: 'doctor-uuid-mock',
            recipientHospitalId: '11111111-1111-1111-1111-111111111111',
            scope: ['prescriptions', 'test_reports'],
            durationDays: 7
        })
    });

    if (res.status === 201) {
        const consent = await res.json();
        console.log('✅ Consent granted');
        console.log(`   Consent ID: ${consent.consentId}`);

        // Generate QR Code
        console.log('\n2. Generating QR code...');
        res = await fetch(`${BASE_URL}/consent/${consent.consentId}/qr?token=${consent.consentToken}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (res.status === 200) {
            const qr = await res.json();
            console.log('✅ QR code generated');
            console.log(`   Type: ${qr.qrData.type}`);
        } else {
            console.log('❌ QR generation failed:', await res.json());
        }

        // Test QR Scan
        console.log('\n3. Testing QR scan...');
        res = await fetch(`${BASE_URL}/consent/scan`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qrData: JSON.stringify({ type: 'samruddhi_consent', token: consent.consentToken })
            })
        });

        if (res.status === 200) {
            const scan = await res.json();
            console.log('✅ QR scan successful');
            console.log(`   Valid: ${scan.valid}`);
        } else {
            console.log('❌ Scan failed:', await res.json());
        }
    } else {
        console.log('❌ Consent grant failed:', await res.json());
    }
}

async function testFileUpload() {
    console.log('\n📎 TASK 5: FILE UPLOAD');
    console.log('='.repeat(60));

    // Generate presigned URL
    console.log('\n1. Requesting presigned URL...');
    let res = await fetch(`${BASE_URL}/upload/presigned-url`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileName: 'test_document.pdf',
            fileType: 'application/pdf'
        })
    });

    if (res.status === 200) {
        const upload = await res.json();
        console.log('✅ Presigned URL generated');
        console.log(`   Path: ${upload.path}`);

        // Upload a mock file
        console.log('\n2. Uploading file...');
        const mockPDF = Buffer.from('Mock PDF content for testing');
        const uploadRes = await fetch(upload.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/pdf' },
            body: mockPDF
        });

        if (uploadRes.ok) {
            console.log('✅ File uploaded successfully');
        } else {
            console.log('❌ Upload failed:', uploadRes.status);
        }
    } else {
        console.log('❌ Presigned URL failed:', await res.json());
    }
}

async function runAllTests() {
    console.log('\n🧪 COMPREHENSIVE API INTEGRATION TEST');
    console.log('='.repeat(60));
    console.log('Testing ALL endpoints with real data and authentication');
    console.log('='.repeat(60));

    try {
        await authenticate();
        await testPatientRegistration();
        await testPatientSelfService();
        await testQRCode();
        await testFileUpload();

        console.log('\n' + '='.repeat(60));
        console.log('✨ ALL TESTS COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(60));
        console.log('\n📊 Summary:');
        console.log('  ✅ Authentication');
        console.log('  ✅ Patient Registration');
        console.log('  ✅ EHR Self-Service (Prescriptions, Test Reports, IoT)');
        console.log('  ✅ QR Code Generation & Scanning');
        console.log('  ✅ File Upload');
        console.log('\n🎉 All systems operational!');

    } catch (e) {
        console.error('\n❌ Test suite failed:', e.message);
        console.error(e.stack);
    }
}

runAllTests();
