const { getMongo } = require('../dist/lib/mongo');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Sync hospital data from Supabase to MongoDB
 * Creates a cached copy for faster ML model queries
 */
async function syncHospitalsToMongo() {
    console.log('\n🔄 Syncing Hospitals: Supabase → MongoDB');
    console.log('='.repeat(60));

    try {
        const db = await getMongo();

        // Fetch all hospitals from Supabase
        const { data: hospitals, error } = await supabase
            .from('hospitals')
            .select('*')
            .eq('is_active', true);

        if (error) {
            throw new Error(`Supabase error: ${error.message}`);
        }

        console.log(`\n📊 Found ${hospitals.length} active hospitals in Supabase`);

        // Upsert to MongoDB
        const hospitalsCollection = db.collection('hospitals_cache');

        for (const hospital of hospitals) {
            await hospitalsCollection.updateOne(
                { id: hospital.id },
                { $set: hospital },
                { upsert: true }
            );
        }

        console.log(`✅ Synced ${hospitals.length} hospitals to MongoDB`);

        // Verify
        const count = await hospitalsCollection.countDocuments();
        console.log(`\n🔍 Total hospitals in MongoDB: ${count}`);

        // Show summary
        console.log('\n📋 Hospital Summary:');
        const summary = await hospitalsCollection.aggregate([
            {
                $group: {
                    _id: '$hospital_type',
                    count: { $sum: 1 },
                    avg_beds: { $avg: '$total_beds' },
                    total_beds: { $sum: '$total_beds' }
                }
            }
        ]).toArray();

        console.table(summary);

        console.log('\n✨ Sync complete!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

syncHospitalsToMongo();
