import { NextRequest, NextResponse } from 'next/server';
import { uploadFileToGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
    }

    // Size limit check (e.g. 10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, message: 'File size exceeds maximum limit of 10MB.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileId = await uploadFileToGridFS(file.name, file.type || 'application/octet-stream', buffer, 'documents');

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully to GridFS.',
      data: {
        fileId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to upload attachment' }, { status: 500 });
  }
}
