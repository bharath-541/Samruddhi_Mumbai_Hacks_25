// Seed script for Samruddhi Hospital Core
// Run with: node scripts/seed.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

async function seed() {
  console.log('🌱 Starting seed...\n');

  try {
    // 1. Create super admin user
    console.log('Creating super admin...');
    const { error: userError } = await supabase.from('users').upsert([
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@samruddhi.health',
        password_hash: '$2b$10$dummyhash',
        role: 'super_admin',
        is_active: true
      }
    ], { onConflict: 'email' });
    if (userError) console.error('User error:', userError.message);
    else console.log('✓ Super admin created');

    // 2. Create 3 hospitals
    console.log('\nCreating hospitals...');
    const { error: hospitalError } = await supabase.from('hospitals').upsert([
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Apollo Hospital Mumbai',
        registration_number: 'MH-APO-2020-001',
        type: 'private',
        tier: 'tertiary',
        address: { street: 'Plot No. 13, Parsik Hill Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400706' },
        contact_phone: '+91-22-6767-9999',
        contact_email: 'contact@apollomumbai.in',
        admin_user_id: '00000000-0000-0000-0000-000000000001',
        is_active: true
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'AIIMS Delhi',
        registration_number: 'DL-AIIMS-1956-001',
        type: 'government',
        tier: 'tertiary',
        address: { street: 'Ansari Nagar East', city: 'New Delhi', state: 'Delhi', pincode: '110029' },
        contact_phone: '+91-11-2658-8500',
        contact_email: 'info@aiims.edu',
        admin_user_id: '00000000-0000-0000-0000-000000000001',
        is_active: true
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Manipal Hospital Bangalore',
        registration_number: 'KA-MAN-2015-042',
        type: 'private',
        tier: 'tertiary',
        address: { street: '98, HAL Airport Road', city: 'Bangalore', state: 'Karnataka', pincode: '560017' },
        contact_phone: '+91-80-2502-4444',
        contact_email: 'contact@manipalhospitals.com',
        admin_user_id: '00000000-0000-0000-0000-000000000001',
        is_active: true
      }
    ], { onConflict: 'id' });
    if (hospitalError) console.error('Hospital error:', hospitalError.message);
    else console.log('✓ 3 hospitals created');

    // 3. Create departments
    console.log('\nCreating departments...');
    const { error: deptError } = await supabase.from('departments').upsert([
      // Apollo Mumbai
      { id: 'd1111111-1111-1111-1111-111111111111', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Cardiology', code: 'CARD', floor_number: 3, is_active: true },
      { id: 'd1111111-1111-1111-1111-111111111112', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Emergency', code: 'EMRG', floor_number: 1, is_active: true },
      { id: 'd1111111-1111-1111-1111-111111111113', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'ICU', code: 'ICU', floor_number: 4, is_active: true },
      // AIIMS Delhi
      { id: 'd2222222-2222-2222-2222-222222222221', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'Neurology', code: 'NEUR', floor_number: 5, is_active: true },
      { id: 'd2222222-2222-2222-2222-222222222222', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'Oncology', code: 'ONCO', floor_number: 6, is_active: true },
      { id: 'd2222222-2222-2222-2222-222222222223', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'General Surgery', code: 'GSUR', floor_number: 2, is_active: true },
      // Manipal Bangalore
      { id: 'd3333333-3333-3333-3333-333333333331', hospital_id: '33333333-3333-3333-3333-333333333333', name: 'Orthopedics', code: 'ORTH', floor_number: 3, is_active: true },
      { id: 'd3333333-3333-3333-3333-333333333332', hospital_id: '33333333-3333-3333-3333-333333333333', name: 'Pediatrics', code: 'PEDI', floor_number: 2, is_active: true }
    ], { onConflict: 'hospital_id,code' });
    if (deptError) console.error('Department error:', deptError.message);
    else console.log('✓ 8 departments created');

    // 4. Create doctors
    console.log('\nCreating doctors...');
    const { error: docError } = await supabase.from('doctors').upsert([
      { id: 'd0c11111-1111-1111-1111-111111111111', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Anjali Mehta', license_number: 'MH-DOC-12345', specialization: 'Cardiologist', qualification: ['MBBS','MD'], department_id: 'd1111111-1111-1111-1111-111111111111', contact_phone: '+91-98765-43210', is_on_duty: true, max_patients: 12, is_active: true },
      { id: 'd0c11111-1111-1111-1111-111111111112', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Rajesh Kumar', license_number: 'MH-DOC-12346', specialization: 'Emergency Physician', qualification: ['MBBS','DNB'], department_id: 'd1111111-1111-1111-1111-111111111112', contact_phone: '+91-98765-43211', is_on_duty: true, max_patients: 15, is_active: true },
      { id: 'd0c11111-1111-1111-1111-111111111113', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Priya Singh', license_number: 'MH-DOC-12347', specialization: 'Intensivist', qualification: ['MBBS','MD','FICCM'], department_id: 'd1111111-1111-1111-1111-111111111113', contact_phone: '+91-98765-43212', is_on_duty: true, max_patients: 8, is_active: true },
      { id: 'd0c11111-1111-1111-1111-111111111114', hospital_id: '11111111-1111-1111-1111-111111111111', name: 'Dr. Vikram Sharma', license_number: 'MH-DOC-12348', specialization: 'General Physician', qualification: ['MBBS'], department_id: 'd1111111-1111-1111-1111-111111111112', contact_phone: '+91-98765-43213', is_on_duty: false, max_patients: 10, is_active: true },
      { id: 'd0c22222-2222-2222-2222-222222222221', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'Dr. Neha Gupta', license_number: 'DL-DOC-56789', specialization: 'Neurologist', qualification: ['MBBS','DM'], department_id: 'd2222222-2222-2222-2222-222222222221', contact_phone: '+91-98765-11111', is_on_duty: true, max_patients: 10, is_active: true },
      { id: 'd0c22222-2222-2222-2222-222222222222', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'Dr. Amit Verma', license_number: 'DL-DOC-56790', specialization: 'Oncologist', qualification: ['MBBS','MD','DrNB'], department_id: 'd2222222-2222-2222-2222-222222222222', contact_phone: '+91-98765-11112', is_on_duty: true, max_patients: 8, is_active: true },
      { id: 'd0c22222-2222-2222-2222-222222222223', hospital_id: '22222222-2222-2222-2222-222222222222', name: 'Dr. Sunita Rao', license_number: 'DL-DOC-56791', specialization: 'Surgeon', qualification: ['MBBS','MS'], department_id: 'd2222222-2222-2222-2222-222222222223', contact_phone: '+91-98765-11113', is_on_duty: false, max_patients: 6, is_active: true },
      { id: 'd0c33333-3333-3333-3333-333333333331', hospital_id: '33333333-3333-3333-3333-333333333333', name: 'Dr. Karthik Reddy', license_number: 'KA-DOC-98765', specialization: 'Orthopedic Surgeon', qualification: ['MBBS','MS Ortho'], department_id: 'd3333333-3333-3333-3333-333333333331', contact_phone: '+91-98765-22221', is_on_duty: true, max_patients: 10, is_active: true },
      { id: 'd0c33333-3333-3333-3333-333333333332', hospital_id: '33333333-3333-3333-3333-333333333333', name: 'Dr. Lakshmi Iyer', license_number: 'KA-DOC-98766', specialization: 'Pediatrician', qualification: ['MBBS','MD Pediatrics'], department_id: 'd3333333-3333-3333-3333-333333333332', contact_phone: '+91-98765-22222', is_on_duty: true, max_patients: 12, is_active: true },
      { id: 'd0c33333-3333-3333-3333-333333333333', hospital_id: '33333333-3333-3333-3333-333333333333', name: 'Dr. Ravi Nair', license_number: 'KA-DOC-98767', specialization: 'Pediatric Surgeon', qualification: ['MBBS','MS'], department_id: 'd3333333-3333-3333-3333-333333333332', contact_phone: '+91-98765-22223', is_on_duty: false, max_patients: 8, is_active: true }
    ], { onConflict: 'license_number' });
    if (docError) console.error('Doctor error:', docError.message);
    else console.log('✓ 10 doctors created');

    // 5. Create beds (50 per hospital)
    console.log('\nCreating beds...');
    const beds = [];
    
    // Apollo Mumbai (50 beds)
    for (let i = 1; i <= 50; i++) {
      beds.push({
        hospital_id: '11111111-1111-1111-1111-111111111111',
        bed_number: `A-${String(i).padStart(3, '0')}`,
        department_id: i <= 10 ? 'd1111111-1111-1111-1111-111111111113' : i <= 25 ? 'd1111111-1111-1111-1111-111111111112' : 'd1111111-1111-1111-1111-111111111111',
        type: i <= 10 ? 'icu' : i <= 25 ? 'emergency' : 'general',
        status: 'available',
        floor_number: i <= 10 ? 4 : i <= 25 ? 1 : 3,
        room_number: `Room-${String(Math.floor((i - 1) / 2) + 1).padStart(3, '0')}`
      });
    }
    
    // AIIMS Delhi (50 beds)
    for (let i = 1; i <= 50; i++) {
      beds.push({
        hospital_id: '22222222-2222-2222-2222-222222222222',
        bed_number: `B-${String(i).padStart(3, '0')}`,
        department_id: i <= 15 ? 'd2222222-2222-2222-2222-222222222221' : i <= 30 ? 'd2222222-2222-2222-2222-222222222222' : 'd2222222-2222-2222-2222-222222222223',
        type: i <= 15 ? 'icu' : 'general',
        status: 'available',
        floor_number: i <= 15 ? 5 : i <= 30 ? 6 : 2,
        room_number: `Room-${String(Math.floor((i - 1) / 2) + 1).padStart(3, '0')}`
      });
    }
    
    // Manipal Bangalore (50 beds)
    for (let i = 1; i <= 50; i++) {
      beds.push({
        hospital_id: '33333333-3333-3333-3333-333333333333',
        bed_number: `C-${String(i).padStart(3, '0')}`,
        department_id: i <= 25 ? 'd3333333-3333-3333-3333-333333333331' : 'd3333333-3333-3333-3333-333333333332',
        type: i <= 10 ? 'icu' : i <= 20 ? 'general' : 'picu',
        status: 'available',
        floor_number: i <= 25 ? 3 : 2,
        room_number: `Room-${String(Math.floor((i - 1) / 2) + 1).padStart(3, '0')}`
      });
    }

    const { error: bedError } = await supabase.from('beds').upsert(beds, { onConflict: 'hospital_id,bed_number' });
    if (bedError) console.error('Bed error:', bedError.message);
    else console.log('✓ 150 beds created (50 per hospital)');

    // 6. Update capacity_summary
    console.log('\nUpdating capacity summaries...');
    const hospitals = ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333'];
    
    for (const hospitalId of hospitals) {
      const { data: bedData } = await supabase.from('beds').select('type, status').eq('hospital_id', hospitalId);
      const summary = {
        total_beds: bedData.length,
        available_beds: bedData.filter(b => b.status === 'available').length,
        occupied_beds: bedData.filter(b => b.status === 'occupied').length,
        icu_total: bedData.filter(b => b.type === 'icu').length,
        icu_available: bedData.filter(b => b.type === 'icu' && b.status === 'available').length
      };
      await supabase.from('hospitals').update({ capacity_summary: summary }).eq('id', hospitalId);
    }
    console.log('✓ Capacity summaries updated');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nSummary:');
    console.log('- 1 super admin user');
    console.log('- 3 hospitals (Apollo Mumbai, AIIMS Delhi, Manipal Bangalore)');
    console.log('- 8 departments');
    console.log('- 10 doctors');
    console.log('- 150 beds (50 per hospital)');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
