#!/usr/bin/env node

/**
 * Comprehensive Database Seeding Script for Samruddhi Backend
 * 
 * Seeds all schemas with realistic, relational data:
 * 1. Hospitals (3 major hospitals in Maharashtra)
 * 2. Departments (multiple per hospital)
 * 3. Auth Users (doctors, staff, patients)
 * 4. Doctors (linked to auth users)
 * 5. Patients (linked to auth users, with ABHA IDs)
 * 6. Beds (50 per hospital, various types)
 * 7. Admissions (active and historical)
 * 8. Bed Demand History (for ML training)
 * 9. Consent Records (sample consent grants)
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper functions
function generateABHAId() {
  const part1 = crypto.randomInt(1000, 9999);
  const part2 = crypto.randomInt(1000, 9999);
  const part3 = crypto.randomInt(1000, 9999);
  return `${part1}-${part2}-${part3}`;
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getDayOfWeek(date) {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1; // Convert to 0=Monday, 6=Sunday
}

function getSeason(month) {
  if ([6, 7, 8, 9].includes(month)) return 'Monsoon';
  if ([12, 1, 2].includes(month)) return 'Winter';
  if ([3, 4, 5].includes(month)) return 'Summer';
  return 'Spring';
}

async function seedData() {
  console.log('\n🌱 Starting Comprehensive Database Seeding');
  console.log('='.repeat(70));

  try {
    // ========================================================================
    // 1. SEED HOSPITALS
    // ========================================================================
    console.log('\n📍 Step 1: Seeding Hospitals...');
    
    const hospitals = [
      {
        id: 'b113834f-b7d3-448c-b646-f1a5bdfb559c',
        name: 'KEM Hospital Mumbai',
        registration_number: 'MH-KEM-1926-001',
        type: 'government',
        tier: 'tertiary',
        hospital_type: 'Government',
        total_beds: 950,
        icu_beds: 140,
        doctors_count: 200,
        nurses_count: 400,
        address: {
          street: 'Acharya Donde Marg, Parel',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400012'
        },
        contact_phone: '+91-22-24107000',
        contact_email: 'admin@kem.edu',
        is_active: true
      },
      {
        id: 'c223945f-c8e4-559d-c757-f2b6ce9c660d',
        name: 'Sion Hospital Mumbai',
        registration_number: 'MH-SION-1937-002',
        type: 'government',
        tier: 'secondary',
        hospital_type: 'Government',
        total_beds: 750,
        icu_beds: 100,
        doctors_count: 150,
        nurses_count: 300,
        address: {
          street: 'Sion-Trombay Road, Sion East',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400022'
        },
        contact_phone: '+91-22-24076401',
        contact_email: 'admin@sionhospital.gov.in',
        is_active: true
      },
      {
        id: 'd334056f-d9f5-660e-d868-a3c7df8d771e',
        name: 'Lilavati Hospital & Research Centre',
        registration_number: 'MH-LILA-1978-003',
        type: 'private',
        tier: 'tertiary',
        hospital_type: 'Private',
        total_beds: 600,
        icu_beds: 100,
        doctors_count: 180,
        nurses_count: 320,
        address: {
          street: 'A-791, Bandra Reclamation',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050'
        },
        contact_phone: '+91-22-26567891',
        contact_email: 'info@lilavatihospital.com',
        is_active: true
      }
    ];

    const { data: insertedHospitals, error: hError } = await supabase
      .from('hospitals')
      .upsert(hospitals, { onConflict: 'id' })
      .select();

    if (hError) throw new Error(`Hospital seeding failed: ${hError.message}`);
    console.log(`   ✅ Seeded ${insertedHospitals.length} hospitals`);

    // ========================================================================
    // 2. SEED DEPARTMENTS
    // ========================================================================
    console.log('\n🏢 Step 2: Seeding Departments...');
    
    const departments = [
      // KEM Hospital departments
      { hospital_id: hospitals[0].id, name: 'Emergency Medicine', code: 'EMRG', floor_number: 1 },
      { hospital_id: hospitals[0].id, name: 'Cardiology', code: 'CARD', floor_number: 3 },
      { hospital_id: hospitals[0].id, name: 'Neurology', code: 'NEUR', floor_number: 4 },
      { hospital_id: hospitals[0].id, name: 'Intensive Care Unit', code: 'ICU', floor_number: 5 },
      { hospital_id: hospitals[0].id, name: 'Orthopedics', code: 'ORTH', floor_number: 2 },
      
      // Sion Hospital departments
      { hospital_id: hospitals[1].id, name: 'General Medicine', code: 'GENM', floor_number: 2 },
      { hospital_id: hospitals[1].id, name: 'Pediatrics', code: 'PEDI', floor_number: 3 },
      { hospital_id: hospitals[1].id, name: 'Surgery', code: 'SURG', floor_number: 4 },
      { hospital_id: hospitals[1].id, name: 'Obstetrics & Gynecology', code: 'OBGY', floor_number: 3 },
      
      // Lilavati Hospital departments
      { hospital_id: hospitals[2].id, name: 'Oncology', code: 'ONCO', floor_number: 6 },
      { hospital_id: hospitals[2].id, name: 'Cardiology', code: 'CARD', floor_number: 5 },
      { hospital_id: hospitals[2].id, name: 'Nephrology', code: 'NEPH', floor_number: 4 },
      { hospital_id: hospitals[2].id, name: 'Gastroenterology', code: 'GAST', floor_number: 3 }
    ];

    const { data: insertedDepts, error: dError } = await supabase
      .from('departments')
      .upsert(departments, { onConflict: 'hospital_id,code' })
      .select();

    if (dError) throw new Error(`Department seeding failed: ${dError.message}`);
    console.log(`   ✅ Seeded ${insertedDepts.length} departments`);

    // ========================================================================
    // 3. SEED AUTH USERS (DOCTORS & STAFF)
    // ========================================================================
    console.log('\n👨‍⚕️ Step 3: Creating Auth Users (Doctors & Staff)...');
    
    const doctorsData = [
      // KEM Hospital doctors
      { name: 'Dr. Rajesh Kumar', email: 'rajesh.kumar@kem.edu', hospital: hospitals[0], specialization: 'Cardiologist', dept: 'CARD' },
      { name: 'Dr. Priya Sharma', email: 'priya.sharma@kem.edu', hospital: hospitals[0], specialization: 'Neurologist', dept: 'NEUR' },
      { name: 'Dr. Amit Patel', email: 'amit.patel@kem.edu', hospital: hospitals[0], specialization: 'Emergency Physician', dept: 'EMRG' },
      { name: 'Dr. Sunita Desai', email: 'sunita.desai@kem.edu', hospital: hospitals[0], specialization: 'Intensivist', dept: 'ICU' },
      { name: 'Dr. Vikram Singh', email: 'vikram.singh@kem.edu', hospital: hospitals[0], specialization: 'Orthopedic Surgeon', dept: 'ORTH' },
      
      // Sion Hospital doctors
      { name: 'Dr. Anjali Mehta', email: 'anjali.mehta@sion.gov.in', hospital: hospitals[1], specialization: 'General Physician', dept: 'GENM' },
      { name: 'Dr. Rahul Verma', email: 'rahul.verma@sion.gov.in', hospital: hospitals[1], specialization: 'Pediatrician', dept: 'PEDI' },
      { name: 'Dr. Kavita Joshi', email: 'kavita.joshi@sion.gov.in', hospital: hospitals[1], specialization: 'Surgeon', dept: 'SURG' },
      
      // Lilavati Hospital doctors
      { name: 'Dr. Anil Kapoor', email: 'anil.kapoor@lilavati.com', hospital: hospitals[2], specialization: 'Oncologist', dept: 'ONCO' },
      { name: 'Dr. Meera Reddy', email: 'meera.reddy@lilavati.com', hospital: hospitals[2], specialization: 'Cardiologist', dept: 'CARD' },
      { name: 'Dr. Suresh Iyer', email: 'suresh.iyer@lilavati.com', hospital: hospitals[2], specialization: 'Nephrologist', dept: 'NEPH' }
    ];

    const createdDoctors = [];
    for (const doc of doctorsData) {
      try {
        let userId = null;
        let isNewUser = false;

        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: doc.email,
          password: 'Doctor@123',
          email_confirm: true,
          user_metadata: {
            role: 'staff',
            name: doc.name,
            hospital_id: doc.hospital.id,
            specialization: doc.specialization
          }
        });

        if (authError && authError.message.includes('already registered')) {
          // User exists, fetch it
          const { data: users } = await supabase.auth.admin.listUsers();
          const existingUser = users.users.find(u => u.email === doc.email);
          if (existingUser) {
            userId = existingUser.id;
          }
        } else if (authData?.user) {
          userId = authData.user.id;
          isNewUser = true;
        }

        if (userId) {
          createdDoctors.push({
            user_id: userId,
            hospital_id: doc.hospital.id,
            name: doc.name,
            email: doc.email,
            specialization: doc.specialization,
            department_code: doc.dept
          });
        }
      } catch (err) {
        console.log(`   ⚠️  Skipped ${doc.email}: ${err.message}`);
      }
    }
    
    console.log(`   ✅ Processed ${createdDoctors.length} doctor auth accounts`);

    // ========================================================================
    // 4. SEED DOCTORS TABLE
    // ========================================================================
    console.log('\n👨‍⚕️ Step 4: Seeding Doctors Table...');
    
    const doctorRecords = createdDoctors.map(doc => {
      const dept = insertedDepts.find(d => 
        d.hospital_id === doc.hospital_id && d.code === doc.department_code
      );
      
      return {
        user_id: doc.user_id,
        hospital_id: doc.hospital_id,
        name: doc.name,
        license_number: `MH-DOC-${crypto.randomInt(10000, 99999)}`,
        specialization: doc.specialization,
        qualification: ['MBBS', 'MD'],
        department_id: dept?.id,
        contact_phone: `+91-${crypto.randomInt(7000000000, 9999999999)}`,
        contact_email: doc.email,
        is_on_duty: Math.random() > 0.3,
        max_patients: crypto.randomInt(8, 15),
        is_active: true
      };
    });

    const { data: insertedDoctors, error: docError } = await supabase
      .from('doctors')
      .insert(doctorRecords)
      .select();

    if (docError) {
      // Try updating existing records if insert fails
      console.log(`   ⚠️  Some doctors may already exist, attempting to update...`);
      const insertedDoctors = [];
      for (const doc of doctorRecords) {
        const { data, error } = await supabase
          .from('doctors')
          .upsert(doc, { onConflict: 'license_number' })
          .select()
          .single();
        if (data) insertedDoctors.push(data);
      }
      console.log(`   ✅ Seeded/Updated ${insertedDoctors.length} doctor records`);
    } else {
      console.log(`   ✅ Seeded ${insertedDoctors.length} doctor records`);
    }

    // ========================================================================
    // 5. SEED PATIENTS
    // ========================================================================
    console.log('\n👤 Step 5: Creating Patient Auth Users...');
    
    const patientNames = [
      'Ramesh Patil', 'Sunita Devi', 'Mohammad Khan', 'Priya Nair', 'Amit Gupta',
      'Lakshmi Iyer', 'Rajesh Yadav', 'Kavita Singh', 'Suresh Reddy', 'Anjali Deshmukh',
      'Vikas Sharma', 'Pooja Mehta', 'Arun Kumar', 'Neha Joshi', 'Sanjay Pawar'
    ];

    const createdPatients = [];
    for (const fullName of patientNames) {
      const email = `${fullName.toLowerCase().replace(' ', '.')}@example.com`;
      const abhaId = generateABHAId();
      
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: 'Patient@123',
          email_confirm: true,
          user_metadata: {
            role: 'patient',
            name: fullName,
            abha_id: abhaId,
            date_of_birth: randomDate(new Date(1950, 0, 1), new Date(2005, 0, 1)).toISOString().split('T')[0],
            gender: Math.random() > 0.5 ? 'male' : 'female',
            blood_group: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'][crypto.randomInt(0, 8)]
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          console.log(`   ⚠️  Failed to create patient ${email}: ${authError.message}`);
          continue;
        }

        const userId = authData?.user?.id || (await supabase.auth.admin.listUsers()).data.users
          .find(u => u.email === email)?.id;

        if (userId) {
          const metadata = authData?.user?.user_metadata || {};
          createdPatients.push({
            user_id: userId,
            full_name: fullName,
            email,
            abha_id: abhaId,
            date_of_birth: metadata.date_of_birth,
            gender: metadata.gender,
            blood_group: metadata.blood_group
          });
        }
      } catch (err) {
        console.log(`   ⚠️  Skipped patient ${email}: ${err.message}`);
      }
    }

    console.log(`   ✅ Created ${createdPatients.length} patient auth accounts`);

    // Seed patients table
    console.log('\n👤 Step 6: Seeding Patients Table...');
    
    const patientRecords = createdPatients.map(p => ({
      abha_id: p.abha_id,
      gender: p.gender,
      blood_group: p.blood_group,
      name_encrypted: null, // Encrypted in production
      dob_encrypted: null,
      emergency_contact_encrypted: null
    }));

    const { data: insertedPatients, error: patError } = await supabase
      .from('patients')
      .insert(patientRecords)
      .select();

    if (patError) {
      console.log(`   ⚠️  Some patients may already exist: ${patError.message}`);
      const insertedPatients = [];
      for (const rec of patientRecords) {
        const { data } = await supabase
          .from('patients')
          .select('*')
          .eq('abha_id', rec.abha_id)
          .single();
        if (data) insertedPatients.push(data);
      }
      console.log(`   ✅ Found ${insertedPatients.length} existing patient records`);
    } else {
      console.log(`   ✅ Seeded ${insertedPatients.length} patient records`);
    }

    // ========================================================================
    // 7. SEED BEDS
    // ========================================================================
    console.log('\n🛏️  Step 7: Seeding Beds...');
    
    const bedTypes = ['general', 'icu', 'emergency', 'isolation'];
    let totalBeds = 0;

    for (const hospital of hospitals) {
      const hospitalDepts = insertedDepts.filter(d => d.hospital_id === hospital.id);
      const bedsPerHospital = [];

      // Create 50 beds per hospital
      for (let i = 1; i <= 50; i++) {
        const bedType = i <= 10 ? 'icu' : i <= 20 ? 'emergency' : i <= 45 ? 'general' : 'isolation';
        const dept = hospitalDepts[crypto.randomInt(0, hospitalDepts.length)];
        
        bedsPerHospital.push({
          hospital_id: hospital.id,
          bed_number: `${hospital.registration_number.split('-')[0]}-BED-${String(i).padStart(3, '0')}`,
          department_id: dept?.id,
          type: bedType,
          status: 'available', // Start all as available, will mark occupied when creating admissions
          floor_number: crypto.randomInt(1, 6),
          room_number: `R${crypto.randomInt(100, 500)}`
        });
      }

      const { error: bedError } = await supabase
        .from('beds')
        .insert(bedsPerHospital);

      if (bedError && !bedError.message.includes('duplicate')) {
        throw new Error(`Bed seeding failed for ${hospital.name}: ${bedError.message}`);
      }
      totalBeds += bedsPerHospital.length;
    }

    console.log(`   ✅ Seeded ${totalBeds} beds across all hospitals`);

    // ========================================================================
    // 8. SEED ADMISSIONS
    // ========================================================================
    console.log('\n🏨 Step 8: Seeding Admissions...');
    
    // Fetch available beds
    const { data: availableBeds, error: bedFetchError } = await supabase
      .from('beds')
      .select('*')
      .eq('status', 'available')
      .limit(20);

    if (bedFetchError) throw new Error(`Failed to fetch beds: ${bedFetchError.message}`);

    const admissions = [];
    for (let i = 0; i < Math.min(10, availableBeds.length, insertedPatients.length); i++) {
      const bed = availableBeds[i];
      const patient = insertedPatients[i];
      const doctor = insertedDoctors.find(d => d.hospital_id === bed.hospital_id);
      
      if (!doctor) continue;

      const admittedDate = randomDate(new Date(2025, 10, 1), new Date(2025, 10, 28));
      
      admissions.push({
        admission_number: `ADM-${Date.now()}-${i}`,
        hospital_id: bed.hospital_id,
        patient_id: patient.id,
        bed_id: bed.id,
        primary_doctor_id: doctor.id,
        department_id: bed.department_id,
        admission_type: ['emergency', 'planned', 'transfer'][crypto.randomInt(0, 3)],
        reason: 'Medical treatment required',
        diagnosis: 'Under observation',
        severity: ['stable', 'serious', 'critical'][crypto.randomInt(0, 3)],
        admitted_at: admittedDate.toISOString(),
        billing_status: 'pending'
      });
    }

    if (admissions.length > 0) {
      const { data: insertedAdmissions, error: admError } = await supabase
        .from('admissions')
        .insert(admissions)
        .select();

      if (admError) throw new Error(`Admission seeding failed: ${admError.message}`);
      console.log(`   ✅ Seeded ${insertedAdmissions.length} admissions`);

      // Update bed status to occupied
      for (const admission of insertedAdmissions) {
        await supabase
          .from('beds')
          .update({ status: 'occupied', current_admission_id: admission.id })
          .eq('id', admission.bed_id);
      }
    }

    // ========================================================================
    // 9. SEED BED DEMAND HISTORY
    // ========================================================================
    console.log('\n📊 Step 9: Seeding Bed Demand History (Last 30 days)...');
    
    const historyRecords = [];
    const today = new Date();
    
    for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(date.getDate() - dayOffset);
      
      for (const hospital of hospitals) {
        const baseOccupancy = hospital.total_beds * 0.7;
        const variance = crypto.randomInt(-50, 100);
        const demand = Math.max(0, Math.floor(baseOccupancy + variance));
        
        historyRecords.push({
          hospital_id: hospital.id,
          date: date.toISOString().split('T')[0],
          day_of_week: getDayOfWeek(date),
          month: date.getMonth() + 1,
          week_of_year: Math.ceil(date.getDate() / 7),
          is_weekend: [0, 6].includes(date.getDay()),
          season: getSeason(date.getMonth() + 1),
          festival_intensity: 0,
          is_festival: false,
          temperature: 25 + crypto.randomInt(-5, 10),
          humidity: 60 + crypto.randomInt(-15, 25),
          aqi: 50 + crypto.randomInt(0, 150),
          rainfall: Math.random() > 0.7 ? crypto.randomInt(0, 50) : 0,
          current_bed_demand: demand,
          total_beds: hospital.total_beds,
          icu_beds: hospital.icu_beds,
          doctors_count: hospital.doctors_count,
          nurses_count: hospital.nurses_count,
          hospital_type: hospital.hospital_type
        });
      }
    }

    const { error: histError } = await supabase
      .from('hospital_bed_demand_history')
      .insert(historyRecords);

    if (histError && !histError.message.includes('duplicate')) {
      throw new Error(`History seeding failed: ${histError.message}`);
    }
    console.log(`   ✅ Seeded ${historyRecords.length} historical bed demand records`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(70));
    console.log('✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   • Hospitals: ${insertedHospitals.length}`);
    console.log(`   • Departments: ${insertedDepts.length}`);
    console.log(`   • Doctors: ${insertedDoctors.length}`);
    console.log(`   • Patients: ${insertedPatients.length}`);
    console.log(`   • Beds: ${totalBeds}`);
    console.log(`   • Active Admissions: ${admissions.length}`);
    console.log(`   • Historical Records: ${historyRecords.length}`);
    console.log(`\n🔐 Test Credentials:`);
    console.log(`   Doctor: rajesh.kumar@kem.edu / Doctor@123`);
    console.log(`   Patient: ramesh.patil@example.com / Patient@123`);
    console.log(`\n🚀 Next Steps:`);
    console.log(`   1. Run authentication tests: node scripts/test_auth_endpoints.js`);
    console.log(`   2. Test ML predictions: node scripts/predict_ml.py`);
    console.log(`   3. Verify deployment: https://samruddhi-backend.onrender.com/health`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Seeding Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the seeding
seedData();
