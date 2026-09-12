import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getFileStreamFromGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid document ID format' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      organizationId: auth.organizationId,
    });

    const targetGridFsId = doc?.gridFsFileId || doc?.fileId;
    if (!doc || !targetGridFsId) {
      return NextResponse.json({ success: false, message: 'Document file not found or access denied' }, { status: 404 });
    }

    if (auth.role === 'EMPLOYEE' && auth.employeeId && doc.employeeId !== auth.employeeId) {
      const allowedRoles = ['Employee', 'Public', 'HR & Admin'];
      if (!allowedRoles.includes(doc.accessRole)) {
        return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
      }
    }

    const fileResult = await getFileStreamFromGridFS(targetGridFsId, 'documents');
    if (!fileResult) {
      return NextResponse.json({ success: false, message: 'File binary not found in MongoDB GridFS' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get('download') === 'true';

    const filename = doc.originalFileName || doc.fileName || fileResult.filename || 'document.pdf';
    const contentType = doc.mimeType || fileResult.contentType || 'application/pdf';

    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(filename)}"`
      : `inline; filename="${encodeURIComponent(filename)}"`;

    return new NextResponse(fileResult.stream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error streaming document file from MongoDB GridFS:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Error streaming document file' },
      { status: 500 }
    );
  }
}
