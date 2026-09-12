import { MongoClient, Db, GridFSBucket, ObjectId } from 'mongodb';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/ems_hrms_db';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export async function getGridFSBucket(): Promise<GridFSBucket> {
  const { db } = await connectToDatabase();
  return new GridFSBucket(db, { bucketName: 'photos' });
}

export async function uploadFileToGridFS(
  filename: string,
  mimeType: string,
  buffer: Buffer
): Promise<string> {
  const bucket = await getGridFSBucket();
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
  fileIdStr: string
): Promise<{ stream: ReadableStream; filename: string; contentType: string } | null> {
  try {
    const bucket = await getGridFSBucket();
    const { db } = await connectToDatabase();
    const objectId = new ObjectId(fileIdStr);

    const files = await db
      .collection('photos.files')
      .find({ _id: objectId })
      .toArray();

    if (!files || files.length === 0) {
      return null;
    }

    const fileDoc = files[0];
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
      filename: fileDoc.filename || 'photo',
      contentType: fileDoc.metadata?.contentType || 'image/jpeg',
    };
  } catch (error) {
    console.error('Error fetching file from GridFS:', error);
    return null;
  }
}

export async function deleteFileFromGridFS(fileIdStr: string): Promise<boolean> {
  try {
    const bucket = await getGridFSBucket();
    const objectId = new ObjectId(fileIdStr);
    await bucket.delete(objectId);
    return true;
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
    return false;
  }
}
