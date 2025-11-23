const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function debugStorage() {
    console.log('🔍 Debugging Supabase Storage...');
    console.log('URL:', process.env.SUPABASE_URL);

    // 1. List Buckets
    console.log('\n1. Listing Buckets (Public/Accessible)...');
    const { data: buckets, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error.message);
    } else {
        console.log('✅ Buckets found:', buckets.length);
        buckets.forEach(b => console.log(`   - ${b.name} (Public: ${b.public})`));

        const target = buckets.find(b => b.name === 'samruddhi-storage');
        if (target) {
            console.log('   ✅ Target bucket "samruddhi-storage" FOUND.');
        } else {
            console.log('   ❌ Target bucket "samruddhi-storage" NOT FOUND in list.');
            console.log('      (Note: If it is Private and you have no RLS to select buckets, it might be hidden)');
        }
    }

    // 2. Try to get bucket details specifically
    console.log('\n2. Checking "samruddhi-storage" directly...');
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket('samruddhi-storage');
    if (bucketError) {
        console.log(`❌ Error getting bucket: ${bucketError.message}`);
    } else {
        console.log('✅ Bucket details retrieved:', bucket);
    }

}

debugStorage();
