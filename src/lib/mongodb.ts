import { MongoClient, Db, GridFSBucket, ObjectId } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<{ client: MongoClient; db: Db }> | undefined;
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesInitialized = false;

async function createDatabaseConnection(): Promise<{ client: MongoClient; db: Db }> {
  const dbName = process.env.MONGODB_DB || 'ems_hrms';
  const mongodbUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!mongodbUri) {
    console.error('Server Configuration Error: MONGODB_URI environment variable is missing.');
    throw new Error('Database configuration is unavailable. Please contact system administrator.');
  }

  try {
    const client = new MongoClient(mongodbUri, {
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    await client.connect();
    const db = client.db(dbName);

    if (!indexesInitialized) {
      ensureProductionIndexes(db).catch((err) =>
        console.error('Error setting up MongoDB production indexes:', err)
      );
      indexesInitialized = true;
    }

    return { client, db };
  } catch (error: any) {
    console.error('Server Database Connection Failure Detail:', {
      message: error?.message || error,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
    });
    throw new Error('Database service is temporarily unavailable. Please contact system administrator.');
  }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // Fast path: Reuse cached MongoClient & Db directly without blocking network ping roundtrip
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createDatabaseConnection().catch((err) => {
      global._mongoClientPromise = undefined;
      cachedClient = null;
      cachedDb = null;
      throw err;
    });
  }

  try {
    const conn = await global._mongoClientPromise;
    cachedClient = conn.client;
    cachedDb = conn.db;
    return conn;
  } catch (err) {
    global._mongoClientPromise = undefined;
    cachedClient = null;
    cachedDb = null;
    throw err;
  }
}

export async function ensureProductionIndexes(db: Db): Promise<void> {
  try {
    // 1. Users: unique email & organization
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ organizationId: 1, email: 1 });

    // 2. Employees: unique organizationId + employeeId, organizationId + userId
    await db.collection('employees').createIndex({ organizationId: 1, employeeId: 1 }, { unique: true, sparse: true });
    await db.collection('employees').createIndex({ organizationId: 1, userId: 1 }, { sparse: true });
    await db.collection('employees').createIndex({ organizationId: 1, status: 1, department: 1 });

    // 3. Documents: organizationId + employeeId, organizationId + uploadedAt
    await db.collection('documents').createIndex({ organizationId: 1, employeeId: 1 });
    await db.collection('documents').createIndex({ organizationId: 1, uploadedAt: -1 });
    await db.collection('documents').createIndex({ organizationId: 1, category: 1 });

    // 4. Attendance: organizationId + date, organizationId + employeeId + date
    await db.collection('attendance').createIndex({ organizationId: 1, date: -1 });
    await db.collection('attendance').createIndex({ organizationId: 1, employeeId: 1, date: -1 });

    // 5. Leaves: organizationId + status, organizationId + employeeId + status, organizationId + startDate
    await db.collection('leaves').createIndex({ organizationId: 1, status: 1, createdAt: -1 });
    await db.collection('leaves').createIndex({ organizationId: 1, employeeId: 1, status: 1 });
    await db.collection('leaves').createIndex({ organizationId: 1, managerId: 1, status: 1 });
    await db.collection('leaves').createIndex({ organizationId: 1, startDate: 1, endDate: 1 });
    await db.collection('leave_balances').createIndex({ organizationId: 1, employeeId: 1, year: 1 }, { unique: true, sparse: true });
    await db.collection('leave_types').createIndex({ organizationId: 1, active: 1 });

    // 6. Payroll: payroll_records unique compound index, salary_rules, salary_structures
    await db.collection('payroll_records').createIndex({ organizationId: 1, employeeId: 1, payrollPeriod: 1 }, { unique: true, sparse: true });
    await db.collection('payroll_records').createIndex({ organizationId: 1, payrollPeriod: -1, status: 1 });

    // 7. Audit Logs
    await db.collection('audit_logs').createIndex({ organizationId: 1, timestamp: -1 });

    // 8. Organization metadata & Public Content
    await db.collection('departments').createIndex({ organizationId: 1 });
    await db.collection('designations').createIndex({ organizationId: 1 });
    await db.collection('locations').createIndex({ organizationId: 1 });

    // 9. HR Helpdesk & Support Tickets
    await db.collection('hr_requests').createIndex({ organizationId: 1, ticketNo: 1 }, { unique: true, sparse: true });
    await db.collection('hr_requests').createIndex({ organizationId: 1, status: 1, updatedAt: -1 });
    await db.collection('hr_requests').createIndex({ organizationId: 1, employeeId: 1 });
    await db.collection('hr_requests').createIndex({ organizationId: 1, assignedToId: 1 });

    // 10. Notifications
    await db.collection('notifications').createIndex({ organizationId: 1, recipientId: 1, status: 1, createdAt: -1 });
    await db.collection('notifications').createIndex({ organizationId: 1, createdAt: -1 });
  } catch (err) {
    console.warn('Index creation warning (indexes may already exist):', err);
  }
}

export async function getGridFSBucket(bucketName: string = 'documents'): Promise<GridFSBucket> {
  const { db } = await connectToDatabase();
  return new GridFSBucket(db, { bucketName });
}

export async function uploadFileToGridFS(
  filename: string,
  mimeType: string,
  buffer: Buffer,
  bucketName: string = 'documents'
): Promise<string> {
  const bucket = await getGridFSBucket(bucketName);
  const uploadStream = bucket.openUploadStream(filename, {
    metadata: {
      contentType: mimeType,
      uploadedAt: new Date(),
    },
  });

  return new Promise((resolve, reject) => {
    uploadStream.on('finish', () => {
      resolve(uploadStream.id.toString());
    });
    uploadStream.on('error', (err) => {
      reject(err);
    });
    uploadStream.end(buffer);
  });
}

export async function getFileStreamFromGridFS(
  fileIdStr: string,
  bucketName: string = 'documents'
): Promise<{ stream: ReadableStream; filename: string; contentType: string } | null> {
  try {
    const bucket = await getGridFSBucket(bucketName);
    const { db } = await connectToDatabase();
    const objectId = new ObjectId(fileIdStr);

    const filesCollection = `${bucketName}.files`;
    const files = await db
      .collection(filesCollection)
      .find({ _id: objectId })
      .toArray();

    if (!files || files.length === 0) {
      const fallbackCollection = bucketName === 'documents' ? 'photos.files' : 'documents.files';
      const fallbackFiles = await db
        .collection(fallbackCollection)
        .find({ _id: objectId })
        .toArray();
      if (!fallbackFiles || fallbackFiles.length === 0) {
        return null;
      }
    }

    const fileDoc = files[0] || (await db.collection(bucketName === 'documents' ? 'photos.files' : 'documents.files').find({ _id: objectId }).toArray())[0];
    const nodeStream = bucket.openDownloadStream(objectId);

    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return {
      stream: webStream,
      filename: fileDoc.filename || 'document',
      contentType: fileDoc.metadata?.contentType || 'application/octet-stream',
    };
  } catch (error) {
    console.error('Error fetching file from GridFS:', error);
    return null;
  }
}

export async function deleteFileFromGridFS(fileIdStr: string, bucketName: string = 'documents'): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket(bucketName);
    const objectId = new ObjectId(fileIdStr);
    await bucket.delete(objectId);
    return true;
  } catch (error) {
    try {
      const fallbackBucket = await getGridFSBucket(bucketName === 'documents' ? 'photos' : 'documents');
      const objectId = new ObjectId(fileIdStr);
      await fallbackBucket.delete(objectId);
      return true;
    } catch (e) {
      console.error('Error deleting file from GridFS:', error);
      return false;
    }
  }
}
