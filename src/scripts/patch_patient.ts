
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function patchPatientMetadata(email: string) {
    console.log(`Patching metadata for ${email}...`);

    // 1. Get user ID from Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Failed to list users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('User not found in Auth');
        return;
    }
    console.log(`Found Auth User: ${user.id}`);

    // 2. Get Patient ID from Database
    const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id, abha_id')
        .eq('ehr_id', user.id)
        .single();

    if (patientError || !patient) {
        console.error('Patient record not found for this user:', patientError);
        // Fallback: Try to find by email if stored in name/encrypted fields (harder)
        // Or just use the known ID from previous chats if DB lookup fails
        console.log('Using known patient ID from previous context...');
        // Known ID from previous successful registration
        const knownPatientId = 'f0f1a779-045c-49d8-9cd6-19dbb1e020f0';
        const knownAbhaId = 'AUTO-74530045-8355';

        await updateMetadata(user.id, knownPatientId, knownAbhaId);
        return;
    }

    console.log(`Found Patient Record: ${patient.id}`);
    await updateMetadata(user.id, patient.id, patient.abha_id);
}

async function updateMetadata(userId: string, patientId: string, abhaId: string) {
    const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        {
            user_metadata: {
                role: 'patient',
                patient_id: patientId,
                abha_id: abhaId
            }
        }
    );

    if (error) {
        console.error('Failed to update metadata:', error);
    } else {
        console.log('✅ Successfully patched user metadata!');
        console.log('New Metadata:', data.user.user_metadata);
        console.log('👉 Please logout and login again to get a new token with these claims.');
    }
}

patchPatientMetadata('demouser1234@example.com');
