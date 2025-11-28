const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedDoctors() {
    console.log('\n👨‍⚕️ Seeding Doctors Data');
    console.log('='.repeat(60));

    try {
        // Get hospitals to link doctors
        const { data: hospitals, error: hError } = await supabase
            .from('hospitals')
            .select('id, name')
            .limit(3);

        if (hError || !hospitals || hospitals.length === 0) {
            throw new Error('No hospitals found. Run seed_hospitals_ml.js first (after migration).');
        }

        const doctors = [
            {
                email: 'dr.arjun@ggh.com',
                password: 'Password123!',
                name: 'Dr. Arjun Mehta',
                specialization: 'Cardiology',
                hospital_index: 0
            },
            {
                email: 'dr.priya@kem.com',
                password: 'Password123!',
                name: 'Dr. Priya Sharma',
                specialization: 'Neurology',
                hospital_index: 1
            },
            {
                email: 'dr.rohan@lilavati.com',
                password: 'Password123!',
                name: 'Dr. Rohan Desai',
                specialization: 'Orthopedics',
                hospital_index: 2
            }
        ];

        console.log(`\n📊 Creating ${doctors.length} doctor accounts...`);

        for (const doc of doctors) {
            // 1. Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: doc.email,
                password: doc.password,
                email_confirm: true,
                user_metadata: {
                    role: 'doctor',
                    name: doc.name,
                    hospital_id: hospitals[doc.hospital_index].id
                }
            });

            if (authError) {
                console.log(`⚠️  Auth user exists or error for ${doc.email}: ${authError.message}`);
                // Continue to try inserting into doctors table if user exists
            }

            const userId = authData.user?.id;
            if (!userId) {
                // Try to get existing user
                const { data: existingUser } = await supabase.from('users').select('id').eq('email', doc.email).single();
                if (!existingUser) continue;
            }

            // 2. Insert into doctors table (if exists in schema, otherwise just users table is enough for auth)
            // Assuming we might have a doctors table or just use users metadata
            // For now, we'll just log success as the auth metadata drives the role
            console.log(`✅ Created/Verified Doctor: ${doc.name} (${hospitals[doc.hospital_index].name})`);
        }

        console.log('\n✨ Doctor seeding complete!');

    } catch (e) {
        console.error('\n❌ Seeding failed:', e.message);
    }
}

seedDoctors();
