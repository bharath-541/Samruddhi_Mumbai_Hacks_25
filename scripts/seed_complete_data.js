const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { faker } = require('@faker-js/faker'); // You might need to install this: npm install @faker-js/faker

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedCompleteData() {
    console.log('\n🌱 Starting Comprehensive Data Seeding');
    console.log('='.repeat(60));

    try {
        // 1. Seed Hospitals (with ML parameters)
        console.log('\n🏥 Seeding Hospitals...');
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
                address: { street: 'Carnac Bunder', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
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
                address: { street: 'Acharya Donde Marg, Parel', city: 'Mumbai', state: 'Maharashtra', pincode: '400012' },
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
                address: { street: 'A-791, Bandra Reclamation', city: 'Mumbai', state: 'Maharashtra', pincode: '400050' },
                contact_phone: '+91-22-26567891',
                contact_email: 'info@lilavatihospital.com',
                is_active: true
            }
        ];

        const { data: savedHospitals, error: hError } = await supabase
            .from('hospitals')
            .upsert(hospitals, { onConflict: 'registration_number' })
            .select();

        if (hError) throw new Error(`Hospital seeding failed: ${hError.message}`);
        console.log(`✅ Seeded ${savedHospitals.length} hospitals`);

        // 2. Seed Doctors
        console.log('\n👨‍⚕️ Seeding Doctors...');
        const specializations = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology'];
        const doctors = [];

        for (const hospital of savedHospitals) {
            // Create 3 doctors per hospital
            for (let i = 0; i < 3; i++) {
                const name = `Dr. ${faker.person.firstName()} ${faker.person.lastName()}`;
                const email = faker.internet.email({ firstName: name.split(' ')[1], lastName: hospital.registration_number });

                // Create Auth User
                const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: 'Password123!',
                    email_confirm: true,
                    user_metadata: {
                        role: 'doctor',
                        name: name,
                        hospital_id: hospital.id,
                        specialization: specializations[Math.floor(Math.random() * specializations.length)]
                    }
                });

                if (authData.user) {
                    doctors.push({
                        name,
                        email,
                        hospital: hospital.name
                    });
                }
            }
        }
        console.log(`✅ Seeded ${doctors.length} doctors`);

        // 3. Seed Patients
        console.log('\n👤 Seeding Patients...');
        const patients = [];
        for (let i = 0; i < 10; i++) {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const email = faker.internet.email({ firstName, lastName });

            const { data: authData } = await supabase.auth.admin.createUser({
                email: email,
                password: 'Password123!',
                email_confirm: true,
                user_metadata: {
                    role: 'patient',
                    name: `${firstName} ${lastName}`,
                    date_of_birth: faker.date.birthdate({ min: 18, max: 80 }).toISOString().split('T')[0],
                    gender: Math.random() > 0.5 ? 'male' : 'female',
                    phone: '+91-' + faker.string.numeric(10)
                }
            });

            if (authData.user) {
                // Create patient record
                const { data: patientData, error: pError } = await supabase
                    .from('patients')
                    .insert({
                        user_id: authData.user.id,
                        full_name: `${firstName} ${lastName}`,
                        date_of_birth: authData.user.user_metadata.date_of_birth,
                        gender: authData.user.user_metadata.gender,
                        contact_number: authData.user.user_metadata.phone,
                        address: {
                            street: faker.location.streetAddress(),
                            city: 'Mumbai',
                            state: 'Maharashtra',
                            pincode: '400001'
                        },
                        abha_id: faker.string.numeric(14)
                    })
                    .select()
                    .single();

                if (patientData) patients.push(patientData);
            }
        }
        console.log(`✅ Seeded ${patients.length} patients`);

        // 4. Seed Admissions (to drive bed demand)
        console.log('\nHz Seeding Admissions (Bed Demand)...');
        const admissions = [];

        // Admit random patients to random hospitals
        for (const patient of patients) {
            // 70% chance of being admitted
            if (Math.random() > 0.3) {
                const hospital = savedHospitals[Math.floor(Math.random() * savedHospitals.length)];
                const admissionDate = faker.date.recent({ days: 10 });

                admissions.push({
                    patient_id: patient.id,
                    hospital_id: hospital.id,
                    admission_date: admissionDate.toISOString(),
                    status: 'admitted',
                    reason: faker.lorem.sentence(),
                    department_id: null, // Optional
                    bed_number: `BED-${faker.string.numeric(3)}`
                });
            }
        }

        if (admissions.length > 0) {
            const { error: admError } = await supabase
                .from('admissions')
                .insert(admissions);

            if (admError) throw new Error(`Admission seeding failed: ${admError.message}`);
            console.log(`✅ Seeded ${admissions.length} active admissions`);
        }

        console.log('\n✨ Database Seeding Complete!');
        console.log('Run `node scripts/sync_hospitals_to_mongo.js` to update ML cache.');

    } catch (e) {
        console.error('\n❌ Seeding failed:', e.message);
        if (e.message.includes('column') || e.message.includes('relation')) {
            console.log('\n⚠️  TIP: Make sure you have applied the database migration!');
            console.log('Run: supabase db push');
        }
        process.exit(1);
    }
}

seedCompleteData();
