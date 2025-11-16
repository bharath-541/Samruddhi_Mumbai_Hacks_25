require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const log = (...args) => console.log('[dryrun]', ...args);
  try {
    const { data: hospitals, error: hErr } = await supabase.from('hospitals').select('id').limit(1);
    if (hErr || !hospitals?.length) throw new Error('No hospitals found');
    const hospitalId = hospitals[0].id;

    const { data: doctor, error: dErr } = await supabase
      .from('doctors')
      .select('id')
      .eq('hospital_id', hospitalId)
      .limit(1)
      .single();
    if (dErr || !doctor) throw new Error('No doctor found for hospital');

    // Create a minimal patient
    const abha = 'ABHA-' + Math.random().toString(36).slice(2, 10);
    const { data: patientRow, error: pErr } = await supabase
      .from('patients')
      .insert([{ abha_id: abha }])
      .select('id')
      .single();
    if (pErr) throw pErr;

    const patientId = patientRow.id;
    const bedType = 'general';

    const { data, error } = await supabase.rpc('admission_create_atomic', {
      p_hospital_id: hospitalId,
      p_patient_id: patientId,
      p_bed_type: bedType,
      p_doctor_id: doctor.id,
      p_reason: 'dryrun test admission'
    });

    if (error) {
      log('RPC error:', error.message);
    } else {
      log('RPC success:', data);
    }
  } catch (e) {
    log('Failed:', e.message);
    process.exitCode = 1;
  }
})();
