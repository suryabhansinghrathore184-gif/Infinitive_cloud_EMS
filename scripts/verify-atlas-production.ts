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

async function runVerification() {
  console.log('=== MONGODB ATLAS PRODUCTION VERIFICATION ===\n');

  if (!atlasUri) {
    console.error('❌ MONGODB_URI is missing in .env');
    return;
  }

  const client = new MongoClient(atlasUri);
  await client.connect();
  const db = client.db('ems_hrms');

  console.log('✅ 1. MongoDB Atlas Connection: PASS');
  console.log('   Database: ems_hrms on Cluster0\n');

  // Clean up non-EMS users from users collection if any exist
  await db.collection('users').deleteMany({
    email: { $regex: '@foodexpress\.com$|@lms\.com$' }
  });

  // Ensure documents collection is created
  const collectionsList = await db.listCollections().toArray();
  const colNames = collectionsList.map(c => c.name);
  if (!colNames.includes('documents')) {
    await db.createCollection('documents');
  }

  // Ensure production indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
  await db.collection('employees').createIndex({ organizationId: 1, employeeId: 1 }, { unique: true, sparse: true });
  await db.collection('employees').createIndex({ organizationId: 1, userId: 1 }, { sparse: true });
  await db.collection('documents').createIndex({ organizationId: 1, employeeId: 1 });
  await db.collection('documents').createIndex({ organizationId: 1, uploadedAt: -1 });
  await db.collection('attendance').createIndex({ organizationId: 1, employeeId: 1, date: 1 });
  await db.collection('leaves').createIndex({ organizationId: 1, employeeId: 1, status: 1 });

  // 2. Collection Data Verification
  console.log('=== 2. COLLECTION DATA & COUNTS ===');
  const collections = ['users', 'employees', 'departments', 'designations', 'holidays', 'attendance', 'salary_structures', 'audit_logs', 'photos.files', 'photos.chunks'];
  
  for (const col of collections) {
    const count = await db.collection(col).countDocuments();
    console.log(`   Collection "${col}": ${count} records`);
  }

  // 3. User Audit
  console.log('\n=== 3. EMS/HRMS USERS VERIFICATION ===');
  const users = await db.collection('users').find({}).toArray();
  console.log(`   Total EMS Users in Atlas: ${users.length}`);

  users.forEach((u: any, idx: number) => {
    console.log(`   [${idx + 1}] Email: ${u.email || u.username || u.id} | Role: ${u.role || 'Admin'} | Org: ${u.organizationId || 'org-default'} | Name: ${u.name || u.firstName || 'User'}`);
  });

  // 4. Employee Relationships
  console.log('\n=== 4. EMPLOYEE RELATIONSHIPS ===');
  const employees = await db.collection('employees').find({}).toArray();
  employees.forEach((emp: any) => {
    console.log(`   Employee: ${emp.firstName || emp.name} (${emp.employeeId}) -> UserRef: ${emp.userId || emp._id} | Org: ${emp.organizationId || 'org-default'}`);
  });

  // 5. GridFS Photos
  console.log('\n=== 5. GRIDFS PROFILE PHOTOS ===');
  const photoFiles = await db.collection('photos.files').countDocuments();
  const photoChunks = await db.collection('photos.chunks').countDocuments();
  console.log(`   photos.files count: ${photoFiles}`);
  console.log(`   photos.chunks count: ${photoChunks}`);

  // 6. Indexes Audit
  console.log('\n=== 6. DATABASE INDEXES VERIFICATION ===');
  for (const col of ['users', 'employees', 'documents', 'attendance', 'leaves']) {
    try {
      const idxs = await db.collection(col).indexes();
      console.log(`   ${col} indexes:`, idxs.map(i => i.name));
    } catch (e) {
      console.log(`   ${col} indexes: default`);
    }
  }

  await client.close();
}

runVerification();
