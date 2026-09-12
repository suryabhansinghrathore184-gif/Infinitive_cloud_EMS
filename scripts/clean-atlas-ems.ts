import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.join(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
let atlasUri = '';
envContent.split('\n').forEach((line) => {
  if (line.startsWith('MONGODB_URI=')) {
    atlasUri = line.replace('MONGODB_URI=', '').replace(/"/g, '').trim();
  }
});

const EMS_COLLECTIONS = new Set([
  'users',
  'employees',
  'departments',
  'designations',
  'locations',
  'documents',
  'documents.files',
  'documents.chunks',
  'photos.files',
  'photos.chunks',
  'attendance',
  'leaves',
  'holidays',
  'salary_structures',
  'audit_logs',
]);

async function cleanAtlas() {
  if (!atlasUri) return;
  const client = new MongoClient(atlasUri);
  await client.connect();
  const db = client.db('ems_hrms');

  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    if (!EMS_COLLECTIONS.has(col.name)) {
      console.log(`Removing non-EMS collection "${col.name}" from Atlas ems_hrms...`);
      await db.collection(col.name).drop();
    }
  }

  console.log('\n=== FINAL VERIFIED ATLAS EMS_HRMS COLLECTIONS & COUNTS ===');
  const remaining = await db.listCollections().toArray();
  const report: Record<string, number> = {};
  for (const col of remaining) {
    report[col.name] = await db.collection(col.name).countDocuments();
  }
  console.log(JSON.stringify(report, null, 2));

  await client.close();
}

cleanAtlas();
