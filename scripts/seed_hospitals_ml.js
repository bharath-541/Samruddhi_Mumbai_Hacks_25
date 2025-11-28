const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY  // Use service role key for admin operations
);

async function seedHospitalData() {
    console.log('\n🏥 Seeding Hospital Data for Bed Prediction Model');
    console.log('='.repeat(60));

    try {
        // Sample hospital data matching the model dataset
        const hospitals = [
            {
                name: 'Government General Hospital Mumbai',
                registration_number: 'GGH-MUM-001',
                type: 'government',
                tier: 'tertiary',
                hospital_type: 'Government',
                total_beds: 850,
                icu_beds: 120,
                doctors_count: 180,
                nurses_count: 360,
                current_bed_demand: 0,  // Will be auto-updated by triggers
                address: {
                    street: 'Carnac Bunder',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400001'
                },
                contact_phone: '+91-22-23076401',
                contact_email: 'admin@ggh-mumbai.gov.in',
                is_active: true
            },
            {
                name: 'KEM Hospital Mumbai',
                registration_number: 'KEM-MUM-002',
                type: 'government',
                tier: 'tertiary',
                hospital_type: 'Government',
                total_beds: 950,
                icu_beds: 140,
                doctors_count: 200,
                nurses_count: 400,
                current_bed_demand: 0,
                address: {
                    street: 'Acharya Donde Marg, Parel',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400012'
                },
                contact_phone: '+91-22-24107000',
                contact_email: 'kem@kem.edu',
                is_active: true
            },
            {
                name: 'Lilavati Hospital',
                registration_number: 'LH-MUM-003',
                type: 'private',
                tier: 'tertiary',
                hospital_type: 'Private',
                total_beds: 600,
                icu_beds: 100,
                doctors_count: 150,
                nurses_count: 300,
                current_bed_demand: 0,
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

        console.log(`\n📊 Inserting ${hospitals.length} hospitals...`);

        const { data, error } = await supabase
            .from('hospitals')
            .upsert(hospitals, { onConflict: 'registration_number' })
            .select();

        if (error) {
            console.error('❌ Error inserting hospitals:', error.message);
            throw error;
        }

        console.log(`✅ Successfully seeded ${data.length} hospitals:`);
        data.forEach(h => {
            console.log(`   - ${h.name} (${h.hospital_type})`);
            console.log(`     Beds: ${h.total_beds} total, ${h.icu_beds} ICU`);
            console.log(`     Staff: ${h.doctors_count} doctors, ${h.nurses_count} nurses`);
        });

        // Verify data
        console.log('\n🔍 Verifying hospital data...');
        const { data: hospitals_check, error: check_error } = await supabase
            .from('hospitals')
            .select('name, total_beds, icu_beds, doctors_count, nurses_count, hospital_type, current_bed_demand')
            .eq('is_active', true);

        if (check_error) {
            console.error('❌ Verification failed:', check_error.message);
        } else {
            console.log('✅ Verification successful:');
            console.table(hospitals_check);
        }

        console.log('\n✨ Hospital seeding complete!');
        console.log('Next: Run migration with `supabase db push` or apply manually');

    } catch (e) {
        console.error('\n❌ Seeding failed:', e.message);
        process.exit(1);
    }
}

seedHospitalData();
