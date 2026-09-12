import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const mongodbUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  const dbName = process.env.MONGODB_DB || 'ems_hrms';

  const diagInfo: Record<string, any> = {
    timestamp: new Date().toISOString(),
    mongodbUriConfigured: Boolean(mongodbUri),
    mongodbUriLength: mongodbUri ? mongodbUri.length : 0,
    databaseNameConfigured: Boolean(process.env.MONGODB_DB),
    targetDatabaseName: dbName,
    hasAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasAuthUrl: Boolean(process.env.NEXTAUTH_URL),
    nodeEnv: process.env.NODE_ENV,
    connectionStatus: 'NOT_TESTED',
    pingStatus: false,
    readStatus: false,
    errorDetails: null,
  };

  if (!mongodbUri) {
    diagInfo.connectionStatus = 'FAILED_MISSING_URI';
    return NextResponse.json(diagInfo, { status: 500 });
  }

  let client: MongoClient | null = null;
  try {
    client = new MongoClient(mongodbUri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 7000,
      connectTimeoutMS: 10000,
    });

    await client.connect();
    diagInfo.connectionStatus = 'CONNECTED';

    const db = client.db(dbName);
    const pingRes = await db.command({ ping: 1 });
    diagInfo.pingStatus = pingRes.ok === 1;

    const count = await db.collection('users').countDocuments();
    diagInfo.readStatus = true;
    diagInfo.usersCount = count;

  } catch (err: any) {
    diagInfo.connectionStatus = 'FAILED_ERROR';
    diagInfo.errorDetails = {
      name: err?.name || 'UnknownError',
      code: err?.code || null,
      message: err?.message ? err.message.replace(/mongodb\+srv:\/\/[^@]+@/g, 'mongodb+srv://[REDACTED]@') : 'No error message',
    };
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }

  return NextResponse.json(diagInfo, { status: diagInfo.connectionStatus === 'CONNECTED' ? 200 : 500 });
}
