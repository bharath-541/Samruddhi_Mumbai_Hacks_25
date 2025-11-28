const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });
dotenv.config();

const BASE_URL = 'http://localhost:3000';

// Use the existing test token or get a new one
const TOKEN = process.env.TOKEN || 'eyJhbGciOiJIUzI1NiIsImtpZCI6InZLR05UWGNZWHpmVUVJZzciLCJ0eXAiOiJKV1QifQ.eyJhYWwiOiJhYWwxIiwiYW1yIjpbeyJtZXRob2QiOiJwYXNzd29yZCIsInRpbWVzdGFtcCI6MTc2Mzg3OTkyN31dLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwiYXVkIjoiYXV0aGVudGljYXRlZCIsImVtYWlsIjoicGF0aWVudF9kZW1vQGV4YW1wbGUuY29tIiwiZXhwIjoxNzYzODgzNTI3LCJpYXQiOjE3NjM4Nzk5MjcsImlzX2Fub255bW91cyI6ZmFsc2UsImlzcyI6Imh0dHBzOi8vYmJneWZ4Z2R5ZXZjaWFnZ2FsbW4uc3VwYWJhc2UuY28vYXV0aC92MSIsInBob25lIjoiIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJzZXNzaW9uX2lkIjoiZjJiNDYwNTMtNGIxNi00Y2JmLTgyYjAtNDhhMjVkZDYxNjFhIiwic3ViIjoiY2MwYTNiODgtZDIxZC00ZTcyLTg1YmUtYWE5YTNlZjA3M2M3IiwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbCI6InBhdGllbnRfZGVtb0BleGFtcGxlLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6ImNjMGEzYjg4LWQyMWQtNGU3Mi04NWJlLWFhOWEzZWYwNzNjNyJ9fQ.jhrBoCdBBCVESVPYDRbh1ERWBYnMzt7zVZs_dO2ELtU';

async function testMLModelDataEndpoints() {
    console.log('\n🧠 Testing ML Model Data Endpoints');
    console.log('='.repeat(60));

    try {
        // Test 1: Get all hospitals model data
        console.log('\n📊 Test 1: GET /ml/model-data (All Hospitals)');
        const allRes = await fetch(`${BASE_URL}/ml/model-data`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        if (allRes.ok) {
            const allData = await allRes.json();
            console.log('✅ Success!');
            console.log(`   Hospitals with data: ${allData.hospitals_count}`);
            console.log(`   Ready for prediction: ${allData.ready_for_batch_prediction}`);

            allData.hospitals.forEach(h => {
                console.log(`\n   🏥 ${h.hospital_name}`);
                console.log(`      Beds: ${h.total_beds}, Demand: ${h.current_demand}`);
                console.log(`      Weather: ${h.temperature}°C, AQI: ${h.aqi}`);
            });

            // Get first hospital ID for single test
            if (allData.hospitals.length > 0) {
                const firstHospitalId = allData.hospitals[0].hospital_id;

                // Test 2: Get single hospital with all features
                console.log(`\n📋 Test 2: GET /ml/model-data/${firstHospitalId} (Full Features)`);
                const singleRes = await fetch(`${BASE_URL}/ml/model-data/${firstHospitalId}`, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });

                if (singleRes.ok) {
                    const singleData = await singleRes.json();
                    console.log('✅ Success!');
                    console.log(`   Hospital: ${singleData.hospital.name}`);
                    console.log(`   Features count: ${singleData.features_count}`);
                    console.log(`   Ready for prediction: ${singleData.ready_for_prediction}`);
                    console.log('\n   Model Data:');
                    console.log(JSON.stringify(singleData.model_data, null, 2));

                    // Test 3: Predict Bed Demand
                    console.log(`\n🤖 Test 3: POST /ml/predict/${firstHospitalId} (ML Prediction)`);
                    const predictRes = await fetch(`${BASE_URL}/ml/predict/${firstHospitalId}`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${TOKEN}` }
                    });

                    if (predictRes.ok) {
                        const predictData = await predictRes.json();
                        console.log('✅ PREDICTION SUCCESS!');
                        console.log(`   Predicted Demand: ${predictData.prediction.predicted_bed_demand}`);
                        console.log(`   Confidence: ${(predictData.prediction.confidence * 100).toFixed(1)}%`);
                        console.log(`   Alert Level: ${predictData.alert_level}`);
                        console.log(`   Recommendation: ${predictData.recommendation}`);
                    } else {
                        const error = await predictRes.json();
                        console.log('❌ Prediction Failed:', predictRes.status, error);
                    }

                } else {
                    const error = await singleRes.json();
                    console.log('❌ Failed:', singleRes.status, error);
                }
            }

        } else {
            const error = await allRes.json();
            console.log('❌ Failed:', allRes.status, error);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✨ ML Model Data Endpoints Test Complete!');
        console.log('='.repeat(60));

    } catch (e) {
        console.error('\n❌ Test failed:', e.message);
    }
}

// Wait 2 seconds for server to start
setTimeout(testMLModelDataEndpoints, 2000);
