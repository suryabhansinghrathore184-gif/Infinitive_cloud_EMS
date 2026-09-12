import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env directly from project root
const envPath = path.join(process.cwd(), '.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
let atlasUri = '';
envContent.split('\n').forEach((line) => {
  if (line.startsWith('MONGODB_URI=')) {
    atlasUri = line.replace('MONGODB_URI=', '').replace(/"/g, '').trim();
  }
});

const localUri = 'mongodb://127.0.0.1:27017';

async function runCheck() {
  console.log('=== MONGODB MIGRATION VERIFICATION SCRIPT ===\n');

  let localClient: MongoClient | null = null;
  let atlasClient: MongoClient | null = null;
  let localData: Record<string, Record<string, number>> = {};
  let atlasData: Record<string, number> = {};
  let localIsRunning = false;

  // 1. Check Local MongoDB on port 27017
  try {
    localClient = new MongoClient(localUri, { serverSelectionTimeoutMS: 3000 });
    await localClient.connect();
    localIsRunning = true;
    console.log('✅ Local MongoDB service detected on 127.0.0.1:27017');

    const adminDb = localClient.db().admin();
    const dbList = await adminDb.listDatabases();
    const localDbs = dbList.databases
      .map((d: any) => d.name)
      .filter((n: string) => n !== 'admin' && n !== 'config' && n !== 'local');

    console.log('   Local databases found:', localDbs);

    for (const dbName of localDbs) {
      const db = localClient.db(dbName);
      const collections = await db.listCollections().toArray();
      localData[dbName] = {};
      for (const col of collections) {
        const count = await db.collection(col.name).countDocuments();
        localData[dbName][col.name] = count;
      }
    }
  } catch (err: any) {
    console.log('ℹ️ Local MongoDB instance status (127.0.0.1:27017):', err.message);
  }

  // 2. Check MongoDB Atlas Cloud (ems_hrms)
  try {
    if (!atlasUri) {
      console.log('❌ MONGODB_URI is missing in .env');
      return;
    }
    atlasClient = new MongoClient(atlasUri, { serverSelectionTimeoutMS: 7000 });
    await atlasClient.connect();
    console.log('✅ MongoDB Atlas Cloud connection established successfully.');

    const atlasDb = atlasClient.db('ems_hrms');
    const atlasCollections = await atlasDb.listCollections().toArray();
    for (const col of atlasCollections) {
      const count = await atlasDb.collection(col.name).countDocuments();
      atlasData[col.name] = count;
    }
  } catch (err: any) {
    console.log('❌ MongoDB Atlas connection error:', err.message);
  }

  console.log('\n--- LOCAL MONGODB CONTENT (Port 27017) ---');
  console.log(JSON.stringify(localData, null, 2));

  console.log('\n--- ATLAS DATABASE (ems_hrms) CONTENT ---');
  console.log(JSON.stringify(atlasData, null, 2));

  // Perform migration from local db if local database contains records and Atlas is missing them
  if (localIsRunning && Object.keys(localData).length > 0 && atlasClient) {
    const atlasDb = atlasClient.db('ems_hrms');

    for (const dbName of Object.keys(localData)) {
      console.log(`\n🔄 Evaluating migration for local DB "${dbName}"...`);
      const localDb = localClient!.db(dbName);

      for (const colName of Object.keys(localData[dbName])) {
        const localCount = localData[dbName][colName];
        if (localCount === 0) continue;

        console.log(`   Transferring collection "${colName}" (${localCount} docs)...`);
        const docs = await localDb.collection(colName).find({}).toArray();

        for (const doc of docs) {
          // Prevent duplicates by _id or unique keys
          const existing = await atlasDb.collection(colName).findOne({ _id: doc._id });
          if (!existing) {
            await atlasDb.collection(colName).insertOne(doc);
          }
        }
        console.log(`   ✅ Collection "${colName}" migrated to MongoDB Atlas.`);
      }
    }

    // Re-count Atlas collections after migration
    console.log('\n--- UPDATED ATLAS DATABASE (ems_hrms) CONTENT AFTER MIGRATION ---');
    const updatedAtlasData: Record<string, number> = {};
    const updatedCols = await atlasDb.listCollections().toArray();
    for (const col of updatedCols) {
      updatedAtlasData[col.name] = await atlasDb.collection(col.name).countDocuments();
    }
    console.log(JSON.stringify(updatedAtlasData, null, 2));
  }

  if (localClient) await localClient.close();
  if (atlasClient) await atlasClient.close();
}

runCheck();
