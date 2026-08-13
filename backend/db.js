import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // ✅ simple and correct

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('MONGODB_URI is not defined. Check your environment variables.');
}
//Server API settings
//These options configure the MongoDB server API version and make the connection behavior stricter and safer regarding deprecated features.
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db('kaamwali_ai');
  }
  return db;
}
