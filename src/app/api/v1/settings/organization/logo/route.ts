import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFileToGridFS,
  getFileStreamFromGridFS,
  deleteFileFromGridFS,
  connectToDatabase,
} from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

// POST /api/v1/settings/organization/logo - Upload Organization Logo to GridFS
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No logo file selected.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, message: 'Invalid file format. Only JPG, PNG, WEBP, and SVG images are supported.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File size exceeds maximum 5 MB limit.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const existingDoc: any = await db.collection('organization_settings').findOne({ organizationId: orgId });
    const oldLogoFileId = existingDoc?.organization?.logoFileId;

    if (oldLogoFileId) {
      try {
        await deleteFileFromGridFS(oldLogoFileId);
      } catch (e) {
        console.warn('Could not delete previous logo:', e);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileId = await uploadFileToGridFS(file.name, file.type, buffer);
    const logoUrl = `/api/v1/settings/organization/logo?id=${fileId}`;

    await db.collection('organization_settings').updateOne(
      { organizationId: orgId },
      {
        $set: {
          'organization.logoFileId': fileId,
          'organization.logoUrl': logoUrl,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPLOAD_ORGANIZATION_LOGO', {
      details: { organizationId: orgId, fileId, filename: file.name },
    });

    return NextResponse.json({
      success: true,
      message: 'Organization logo uploaded successfully!',
      fileId,
      logoUrl,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/settings/organization/logo:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload organization logo.' },
      { status: 500 }
    );
  }
}

// GET /api/v1/settings/organization/logo - Stream Organization Logo
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const { searchParams } = new URL(req.url);
    let fileId = searchParams.get('id');

    const { db } = await connectToDatabase();

    if (!fileId) {
      const orgDoc: any = await db.collection('organization_settings').findOne({ organizationId: auth.organizationId });
      if (orgDoc?.organization?.logoFileId) {
        fileId = orgDoc.organization.logoFileId;
      }
    }

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'Organization logo ID not found.' },
        { status: 404 }
      );
    }

    const fileResult = await getFileStreamFromGridFS(fileId);
    if (!fileResult) {
      return NextResponse.json(
        { success: false, message: 'Logo binary not found in GridFS storage.' },
        { status: 404 }
      );
    }

    return new NextResponse(fileResult.stream as any, {
      status: 200,
      headers: {
        'Content-Type': fileResult.contentType,
        'Content-Disposition': `inline; filename="${fileResult.filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve logo.' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/settings/organization/logo - Remove Organization Logo
export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const orgDoc: any = await db.collection('organization_settings').findOne({ organizationId: orgId });
    const fileId = orgDoc?.organization?.logoFileId;

    if (fileId) {
      try {
        await deleteFileFromGridFS(fileId);
      } catch (delErr) {
        console.warn('Could not delete logo from GridFS:', delErr);
      }
    }

    await db.collection('organization_settings').updateOne(
      { organizationId: orgId },
      {
        $unset: {
          'organization.logoFileId': '',
          'organization.logoUrl': '',
        },
        $set: { updatedAt: new Date() },
      }
    );

    await logAuditEvent(req, 'REMOVE_ORGANIZATION_LOGO', { details: { organizationId: orgId, fileId } });

    return NextResponse.json({
      success: true,
      message: 'Organization logo removed successfully.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Failed to remove logo.' },
      { status: 500 }
    );
  }
}
