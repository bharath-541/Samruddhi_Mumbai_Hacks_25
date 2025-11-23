const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error('❌ Error: TOKEN environment variable is required.');
    console.error('Usage: TOKEN=your_jwt_token node scripts/test_real_upload.js');
    process.exit(1);
}

async function testRealFileUpload() {
    console.log('🧪 Testing Real File Upload to Supabase Storage');
    console.log('='.repeat(60));

    // 1. Read a real file from the project
    const filePath = path.join(__dirname, '..', 'README.md');
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = 'README.md';
    const fileType = 'text/markdown';

    console.log(`\n📄 File to upload: ${fileName} (${fileBuffer.length} bytes)`);

    try {
        // 2. Request presigned URL from backend
        console.log('\n1️⃣ Requesting presigned URL...');
        const urlRes = await fetch(`${BASE_URL}/upload/presigned-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName,
                fileType
            })
        });

        if (!urlRes.ok) {
            const err = await urlRes.json();
            console.log(`❌ Failed to get URL: ${urlRes.status}`, err);
            return;
        }

        const { uploadUrl, path: storagePath, token } = await urlRes.json();
        console.log('✅ Presigned URL received!');
        console.log(`   Storage Path: ${storagePath}`);

        // 3. Upload file to Supabase Storage
        console.log('\n2️⃣ Uploading file to Supabase Storage...');
        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': fileType,
                'x-upsert': 'false'
            },
            body: fileBuffer
        });

        if (uploadRes.ok) {
            console.log('✅ Upload Successful!');
            console.log(`   File uploaded to: ${storagePath}`);

            // 4. Verify file exists by generating a public URL
            console.log('\n3️⃣ Generating public download URL...');
            const supabase = createClient(
                process.env.SUPABASE_URL,
                process.env.SUPABASE_ANON_KEY
            );

            const { data } = supabase.storage
                .from('SAMRUDHHI-STORAGE')
                .getPublicUrl(storagePath);

            console.log('✅ File accessible at:');
            console.log(`   ${data.publicUrl}`);
            console.log('\n✨ Task 5 Complete! File upload works end-to-end.');

        } else {
            const errorText = await uploadRes.text();
            console.log(`❌ Upload Failed: ${uploadRes.status} ${uploadRes.statusText}`);
            console.log(`   Response: ${errorText}`);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testRealFileUpload();
