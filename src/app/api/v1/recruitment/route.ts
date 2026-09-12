import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const [jobs, candidates] = await Promise.all([
      db.collection('jobs').find({ organizationId: orgId }).toArray(),
      db.collection('candidates').find({ organizationId: orgId }).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        jobs,
        candidates,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch recruitment data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { entityType, data } = body; // entityType: 'job' | 'candidate'

    if (!entityType || !data) {
      return NextResponse.json({ success: false, message: 'Missing entityType or data payload' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();
    const collectionName = entityType === 'job' ? 'jobs' : 'candidates';

    const doc = {
      ...data,
      organizationId: orgId,
      updatedAt: now,
    };

    if (data.id) {
      await db.collection(collectionName).updateOne(
        { organizationId: orgId, id: data.id },
        { $set: doc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
    } else {
      doc.id = `${entityType}-${Date.now()}`;
      doc.createdAt = now;
      await db.collection(collectionName).insertOne(doc);
    }

    await logAuditEvent(req, `CREATE_${entityType.toUpperCase()}`, { details: doc });

    const items = await db.collection(collectionName).find({ organizationId: orgId }).toArray();

    return NextResponse.json({
      success: true,
      message: `${entityType === 'job' ? 'Job opening' : 'Candidate record'} saved successfully.`,
      data: items,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to save recruitment entity' }, { status: 500 });
  }
}
