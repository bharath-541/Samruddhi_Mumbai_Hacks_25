
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

async function makeDoctor(email: string) {
    console.log(`Promoting ${email} to doctor...`);

    // 1. Get user ID
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error('Failed to list users:', listError);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('User not found');
        return;
    }

    console.log(`Found user ${user.id}`);

    // 2. Update metadata
    const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
            user_metadata: {
                role: 'doctor',
                hospital_id: 'hospital-123', // Dummy hospital ID for testing
                doctor_id: 'doctor-123'      // Dummy doctor ID
            }
        }
    );

    if (error) {
        console.error('Failed to update user:', error);
    } else {
        console.log('Successfully updated user metadata:', data.user.user_metadata);
    }
}

makeDoctor('demouser1234@example.com');
