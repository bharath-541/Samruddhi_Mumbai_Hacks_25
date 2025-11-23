const BASE_URL = 'http://localhost:3000';
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
    console.error('❌ Error: TOKEN environment variable is required.');
    console.error('Usage: TOKEN=your_jwt_token node scripts/test_file_upload.js');
    process.exit(1);
}

async function testFileUpload() {
    console.log('🧪 TASK 5: File Upload Support Tests');
    console.log('='.repeat(60));

    // 1. Generate Presigned URL
    console.log('\n1. Requesting Presigned URL...');
    const fileName = `test_report_${Date.now()}.txt`;

    try {
        const res = await fetch(`${BASE_URL}/upload/presigned-url`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileName,
                fileType: 'application/pdf' // Mocking as PDF for validation
            })
        });

        if (res.status !== 200) {
            const err = await res.json();
            console.log(`❌ Failed: ${res.status}`, err);
            return;
        }

        const data = await res.json();
        console.log('✅ URL Generated!');
        console.log(`   Path: ${data.path}`);
        console.log(`   URL: ${data.uploadUrl.substring(0, 50)}...`);

        // 2. Upload File (Mocking upload to the signed URL)
        console.log('\n2. Uploading File to Storage...');
        // Note: To actually upload, we need to PUT to the signed URL.
        // Since we are mocking a text file but said it was PDF, Supabase might complain if it checks content-type strictly on upload.
        // Let's try uploading a simple buffer.

        const uploadRes = await fetch(data.uploadUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/pdf'
            },
            body: 'This is a dummy PDF content for testing.'
        });

        if (uploadRes.status === 200) {
            console.log('✅ Upload Successful!');
        } else {
            console.log(`❌ Upload Failed: ${uploadRes.status} ${uploadRes.statusText}`);
            const text = await uploadRes.text();
            console.log(`   Response: ${text}`);

            if (text.includes('Bucket not found')) {
                console.log('\n⚠️  NOTE: You need to create the "medical-documents" bucket in Supabase Storage!');
            }
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

testFileUpload();
