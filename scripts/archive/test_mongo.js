require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌ MONGO_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('ehr_records');

    const demoRecord = {
      patient_id: 'patient-123',
      abha_id: 'ABHA-TEST-001',
      records: [
        {
          type: 'vitals',
          date: new Date().toISOString(),
          data: { bp: '120/80', pulse: 72, temp: 98.6 }
        }
      ],
      created_at: new Date().toISOString()
    };

    console.log('\n✓ Inserting demo EHR record:', demoRecord.patient_id);
    const insertResult = await collection.insertOne(demoRecord);
    console.log('Inserted ID:', insertResult.insertedId);

    console.log('\n✓ Reading back from MongoDB:');
    const fetched = await collection.findOne({ patient_id: 'patient-123' });
    console.log(JSON.stringify(fetched, null, 2));

    if (fetched && fetched.patient_id === 'patient-123') {
      console.log('\n✅ MongoDB working correctly!');
    } else {
      console.error('\n❌ MongoDB read mismatch');
    }
  } catch (e) {
    console.error('❌ MongoDB error:', e.message);
  } finally {
    await client.close();
  }
})();
