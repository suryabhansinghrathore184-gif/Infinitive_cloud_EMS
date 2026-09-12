import { MongoClient, Db, GridFSBucket, ObjectId } from 'mongodb';



let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesInitialized = false;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const mongodbUri = process.env.MONGODB_URI || process.env.DATABASE_URL;

  if (!mongodbUri) {
    console.error('Server Configuration Error: MONGODB_URI environment variable is missing.');
    throw new Error('Database configuration is unavailable. Please contact system administrator.');
  }

  try {
    const client = new MongoClient(mongodbUri);
    const dbName = process.env.MONGODB_DB || 'ems_hrms';
    const db = client.db(dbName);

    cachedClient = client;
    cachedDb = db;

    if (!indexesInitialized) {
      ensureProductionIndexes(db).catch((err) =>
        console.error('Error setting up MongoDB production indexes:', err)
      );
      indexesInitialized = true;
    }

    return { client, db };
  } catch (error: any) {
    console.error('Server Database Connection Failure:', error?.message || error);
    throw new Error('Database service is temporarily unavailable. Please contact system administrator.');
  }
}

export async function ensureProductionIndexes(db: Db): Promise<void> {
  try {
    // 1. Users: unique email
    await db.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await db.collection('users').createIndex({ organizationId: 1 });

    // 2. Employees: unique organizationId + employeeId, organizationId + userId
    await db.collection('employees').createIndex({ organizationId: 1, employeeId: 1 }, { unique: true, sparse: true });
    await db.collection('employees').createIndex({ organizationId: 1, userId: 1 }, { sparse: true });

    // 3. Documents: organizationId + employeeId, organizationId + uploadedAt
    await db.collection('documents').createIndex({ organizationId: 1, employeeId: 1 });
    await db.collection('documents').createIndex({ organizationId: 1, uploadedAt: -1 });
    await db.collection('documents').createIndex({ category: 1 });
    await db.collection('documents').createIndex({ accessRole: 1 });

    // 4. Attendance: organizationId + employeeId + date (Non-unique to preserve multi-session check-ins per day)
    await db.collection('attendance').createIndex({ organizationId: 1, employeeId: 1, date: 1 });

    // 5. Leaves: organizationId + employeeId + status, organizationId + managerId + status
    await db.collection('leaves').createIndex({ organizationId: 1, employeeId: 1, status: 1 });
    await db.collection('leaves').createIndex({ organizationId: 1, managerId: 1, status: 1 });
    await db.collection('leave_balances').createIndex({ organizationId: 1, employeeId: 1, year: 1 }, { unique: true, sparse: true });

    // 6. Payroll: payroll_records unique compound index, salary_rules, salary_structures, salary_assignments
    await db.collection('payroll_records').createIndex({ organizationId: 1, employeeId: 1, payrollPeriod: 1 }, { unique: true, sparse: true });
    await db.collection('payroll_records').createIndex({ organizationId: 1, payrollPeriod: 1 });
    await db.collection('payroll_records').createIndex({ organizationId: 1, status: 1 });

    await db.collection('salary_rules').createIndex({ organizationId: 1, enabled: 1 });
    await db.collection('salary_rules').createIndex({ organizationId: 1, code: 1 }, { unique: true, sparse: true });

    await db.collection('salary_structures').createIndex({ organizationId: 1, employeeId: 1 });
    await db.collection('salary_assignments').createIndex({ organizationId: 1, employeeId: 1, status: 1 });

    // 7. Audit Logs
    await db.collection('audit_logs').createIndex({ organizationId: 1, timestamp: -1 });

    // 8. Organization metadata
    await db.collection('departments').createIndex({ organizationId: 1 });
    await db.collection('designations').createIndex({ organizationId: 1 });
    await db.collection('locations').createIndex({ organizationId: 1 });
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
      // Fallback check in photos.files if searching documents and vice versa
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

    // Convert Node stream to Web ReadableStream for Next.js Response
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
    // Try fallback bucket if primary fails
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
