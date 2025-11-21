import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongo(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    connectTimeoutMS: 5000,
  });
  
  await client.connect();
  db = client.db();
  console.log('MongoDB connected successfully');
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null; db = null;
  }
}
