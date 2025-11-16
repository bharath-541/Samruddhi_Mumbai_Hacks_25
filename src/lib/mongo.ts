import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongo(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set');
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export async function closeMongo() {
  if (client) {
    await client.close();
    client = null; db = null;
  }
}
