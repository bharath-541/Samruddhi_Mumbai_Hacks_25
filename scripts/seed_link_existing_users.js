#!/usr/bin/env node

/**
 * Link Existing Auth Users to Doctors and Patients Tables
 * 
 * This script finds all existing Supabase auth users and creates
 * corresponding records in the doctors and patients tables.
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

function generateABHAId() {
  const part1 = crypto.randomInt(1000, 9999);
  const part2 = crypto.randomInt(1000, 9999);
  const part3 = crypto.randomInt(1000, 9999);
  return `${part1}-${part2}-${part3}`;
}

async function linkExistingUsers() {
  console.log('\n🔗 Linking Existing Auth Users to Database Tables');
  console.log('='.repeat(70));

  try {
    // Fetch all auth users
    console.log('\n📋 Fetching all auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw new Error(`Failed to fetch users: ${authError.message}`);
    console.log(`   Found ${authUsers.users.length} auth users`);

    // Get all hospitals
    const { data: hospitals, error: hError } = await supabase
      .from('hospitals')
      .select('*');
    
    if (hError) throw new Error(`Failed to fetch hospitals: ${hError.message}`);

    // Get all departments
    const { data: departments, error: dError } = await supabase
      .from('departments')
      .select('*');
    
    if (dError) throw new Error(`Failed to fetch departments: ${dError.message}`);

    // ========================================================================
    // 1. LINK DOCTORS
    // ========================================================================
    console.log('\n👨‍⚕️ Processing Doctor Users...');
    
    const doctorUsers = authUsers.users.filter(u => 
      u.user_metadata?.role === 'staff' || 
      u.email.includes('kem.edu') || 
      u.email.includes('sion.gov.in') || 
      u.email.includes('lilavati.com')
    );

    const doctorRecords = [];
    for (const user of doctorUsers) {
      const hospitalId = user.user_metadata?.hospital_id || hospitals[0]?.id;
      const dept = departments.find(d => d.hospital_id === hospitalId);
      
      doctorRecords.push({
        user_id: user.id,
        hospital_id: hospitalId,
        name: user.user_metadata?.name || user.email.split('@')[0],
        license_number: `MH-DOC-${crypto.randomInt(10000, 99999)}`,
        specialization: user.user_metadata?.specialization || 'General Medicine',
        qualification: ['MBBS', 'MD'],
        department_id: dept?.id,
        contact_phone: `+91-${crypto.randomInt(7000000000, 9999999999)}`,
        contact_email: user.email,
        is_on_duty: true,
        max_patients: crypto.randomInt(8, 15),
        is_active: true
      });
    }

    if (doctorRecords.length > 0) {
      // Check which doctors already exist
      const { data: existingDoctors } = await supabase
        .from('doctors')
        .select('user_id');
      
      const existingUserIds = new Set(existingDoctors?.map(d => d.user_id) || []);
      const newDoctors = doctorRecords.filter(d => !existingUserIds.has(d.user_id));

      if (newDoctors.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('doctors')
          .insert(newDoctors)
          .select();

        if (insertError) {
          console.log(`   ⚠️  Error inserting doctors: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created ${inserted.length} doctor records`);
        }
      } else {
        console.log(`   ℹ️  All doctors already exist in database`);
      }
    }

    // ========================================================================
    // 2. LINK PATIENTS
    // ========================================================================
    console.log('\n👤 Processing Patient Users...');
    
    const patientUsers = authUsers.users.filter(u => 
      u.user_metadata?.role === 'patient' || 
      u.email.includes('example.com')
    );

    const patientRecords = [];
    for (const user of patientUsers) {
      const abhaId = user.user_metadata?.abha_id || generateABHAId();
      
      patientRecords.push({
        abha_id: abhaId,
        gender: user.user_metadata?.gender || 'male',
        blood_group: user.user_metadata?.blood_group || 'O+',
        name_encrypted: null,
        dob_encrypted: null,
        emergency_contact_encrypted: null
      });
    }

    if (patientRecords.length > 0) {
      // Check which patients already exist
      const { data: existingPatients } = await supabase
        .from('patients')
        .select('abha_id');
      
      const existingAbhas = new Set(existingPatients?.map(p => p.abha_id) || []);
      const newPatients = patientRecords.filter(p => !existingAbhas.has(p.abha_id));

      if (newPatients.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('patients')
          .insert(newPatients)
          .select();

        if (insertError) {
          console.log(`   ⚠️  Error inserting patients: ${insertError.message}`);
        } else {
          console.log(`   ✅ Created ${inserted.length} patient records`);
        }
      } else {
        console.log(`   ℹ️  All patients already exist in database`);
      }
    }

    // ========================================================================
    // 3. CREATE SOME ADMISSIONS
    // ========================================================================
    console.log('\n🏨 Creating Sample Admissions...');
    
    // Get available beds
    const { data: availableBeds } = await supabase
      .from('beds')
      .select('*')
      .eq('status', 'available')
      .limit(10);

    // Get doctors
    const { data: doctors } = await supabase
      .from('doctors')
      .select('*')
      .limit(10);

    // Get patients
    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .limit(10);

    if (availableBeds && doctors && patients && 
        availableBeds.length > 0 && doctors.length > 0 && patients.length > 0) {
      
      const admissions = [];
      const numAdmissions = Math.min(5, availableBeds.length, patients.length);

      for (let i = 0; i < numAdmissions; i++) {
        const bed = availableBeds[i];
        const patient = patients[i];
        const doctor = doctors.find(d => d.hospital_id === bed.hospital_id) || doctors[0];

        admissions.push({
          admission_number: `ADM-${Date.now()}-${i}`,
          hospital_id: bed.hospital_id,
          patient_id: patient.id,
          bed_id: bed.id,
          primary_doctor_id: doctor.id,
          department_id: bed.department_id,
          admission_type: 'emergency',
          reason: 'Medical treatment required',
          diagnosis: 'Under observation',
          severity: 'stable',
          admitted_at: new Date().toISOString(),
          billing_status: 'pending'
        });
      }

      const { data: insertedAdmissions, error: admError } = await supabase
        .from('admissions')
        .insert(admissions)
        .select();

      if (admError) {
        console.log(`   ⚠️  Error creating admissions: ${admError.message}`);
      } else {
        console.log(`   ✅ Created ${insertedAdmissions.length} admissions`);

        // Update bed status
        for (const admission of insertedAdmissions) {
          await supabase
            .from('beds')
            .update({ 
              status: 'occupied', 
              current_admission_id: admission.id,
              last_occupied_at: new Date().toISOString()
            })
            .eq('id', admission.bed_id);
        }
        console.log(`   ✅ Updated bed statuses`);
      }
    }

    // ========================================================================
    // 4. UPDATE HOSPITAL STATS
    // ========================================================================
    console.log('\n📊 Updating Hospital Statistics...');
    
    for (const hospital of hospitals) {
      const { data: bedStats } = await supabase
        .from('beds')
        .select('status, type')
        .eq('hospital_id', hospital.id);

      const totalBeds = bedStats?.length || 0;
      const occupiedBeds = bedStats?.filter(b => b.status === 'occupied').length || 0;
      const icuBeds = bedStats?.filter(b => b.type === 'icu').length || 0;
      const icuAvailable = bedStats?.filter(b => b.type === 'icu' && b.status === 'available').length || 0;

      await supabase
        .from('hospitals')
        .update({
          capacity_summary: {
            total_beds: totalBeds,
            available_beds: totalBeds - occupiedBeds,
            occupied_beds: occupiedBeds,
            icu_total: icuBeds,
            icu_available: icuAvailable
          },
          current_bed_demand: occupiedBeds
        })
        .eq('id', hospital.id);
    }

    console.log(`   ✅ Updated statistics for ${hospitals.length} hospitals`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    const { data: finalDoctors } = await supabase.from('doctors').select('id');
    const { data: finalPatients } = await supabase.from('patients').select('id');
    const { data: finalAdmissions } = await supabase.from('admissions').select('id').is('discharged_at', null);
    const { data: finalBeds } = await supabase.from('beds').select('id');

    console.log('\n' + '='.repeat(70));
    console.log('✨ LINKING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log(`\n📊 Current Database State:`);
    console.log(`   • Hospitals: ${hospitals.length}`);
    console.log(`   • Departments: ${departments.length}`);
    console.log(`   • Doctors: ${finalDoctors?.length || 0}`);
    console.log(`   • Patients: ${finalPatients?.length || 0}`);
    console.log(`   • Beds: ${finalBeds?.length || 0}`);
    console.log(`   • Active Admissions: ${finalAdmissions?.length || 0}`);
    console.log(`\n🔐 Test Credentials:`);
    console.log(`   Doctor: rajesh.kumar@kem.edu / Doctor@123`);
    console.log(`   Patient: ramesh.patil@example.com / Patient@123`);
    console.log(`\n🚀 Ready to test! Run: node scripts/test_auth_endpoints.js`);
    console.log('');

  } catch (error) {
    console.error('\n❌ Linking Failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the linking
linkExistingUsers();
