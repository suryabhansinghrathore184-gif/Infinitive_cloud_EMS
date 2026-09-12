import { connectToDatabase, getGridFSBucket } from '@/lib/mongodb';

export interface GridFSHealthResult {
  provider: 'gridfs';
  status: 'CONNECTED' | 'CONNECTION_FAILED';
  bucketPhotos: boolean;
  bucketDocuments: boolean;
  photosCount: number;
  documentsCount: number;
  storageType: string;
  lastHealthCheck: string;
  message: string;
}

/**
 * Performs a safe, non-destructive health test on the application's MongoDB GridFS buckets.
 * Inspects existing 'photos' and 'documents' buckets and metadata counts.
 */
export async function testGridFSConnection(): Promise<GridFSHealthResult> {
  const nowISO = new Date().toISOString();
  try {
    const { db } = await connectToDatabase();

    // Verify DB ping
    await db.command({ ping: 1 });

    // Inspect GridFS buckets
    const photosBucket = await getGridFSBucket('photos');
    const documentsBucket = await getGridFSBucket('documents');

    // Safe metadata count queries (does not alter or delete production files)
    const photosCount = await db.collection('photos.files').countDocuments();
    const documentsCount = await db.collection('documents.files').countDocuments();

    return {
      provider: 'gridfs',
      status: 'CONNECTED',
      bucketPhotos: true,
      bucketDocuments: true,
      photosCount,
      documentsCount,
      storageType: 'MongoDB GridFS Binary Vault',
      lastHealthCheck: nowISO,
      message: `GridFS Storage Driver active. Bucket 'photos': ${photosCount} files, Bucket 'documents': ${documentsCount} files.`,
    };
  } catch (err: any) {
    console.error('GridFS Health Test Error:', err);
    return {
      provider: 'gridfs',
      status: 'CONNECTION_FAILED',
      bucketPhotos: false,
      bucketDocuments: false,
      photosCount: 0,
      documentsCount: 0,
      storageType: 'MongoDB GridFS Binary Vault',
      lastHealthCheck: nowISO,
      message: err?.message || 'Unable to connect to MongoDB GridFS binary storage.',
    };
  }
}
