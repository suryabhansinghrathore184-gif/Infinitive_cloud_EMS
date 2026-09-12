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

    const announcements = await db
      .collection('announcements')
      .find({ organizationId: orgId })
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: announcements.map((a: any) => ({
        ...a,
        id: a.id || a._id.toString(),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
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
    const {
      id,
      title,
      slug,
      shortDescription,
      content,
      category,
      priority,
      imageUrl,
      fileId,
      visibility,
      status,
      publishAt,
      expiresAt,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: 'Announcement title and content are required.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();
    const generatedSlug =
      slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const annDoc: any = {
      title,
      slug: generatedSlug,
      shortDescription: shortDescription || content.slice(0, 160) + '...',
      content,
      category: category || 'General',
      priority: priority || 'Normal',
      imageUrl: imageUrl || '',
      fileId: fileId || '',
      visibility: visibility || 'Internal Only',
      status: status || 'Published',
      publishAt: publishAt || now.toISOString(),
      expiresAt: expiresAt || null,
      organizationId: orgId,
      updatedAt: now,
    };

    if (id) {
      annDoc.id = id;
      await db
        .collection('announcements')
        .updateOne(
          { organizationId: orgId, $or: [{ id }, { _id: id }] },
          { $set: annDoc, $setOnInsert: { createdAt: now } },
          { upsert: true }
        );
    } else {
      annDoc.id = `ann-${Date.now()}`;
      annDoc.createdAt = now;
      annDoc.createdBy = auth.email || 'HR Administrator';
      await db.collection('announcements').insertOne(annDoc);
    }

    await logAuditEvent(req, 'SAVE_ANNOUNCEMENT', {
      details: { title, visibility: annDoc.visibility, status: annDoc.status },
    });

    const allAnnouncements = await db
      .collection('announcements')
      .find({ organizationId: orgId })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      message: `Announcement "${title}" ${id ? 'updated' : 'created'} successfully.`,
      data: allAnnouncements.map((a: any) => ({ ...a, id: a.id || a._id.toString() })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save announcement' },
      { status: 500 }
    );
  }
}
