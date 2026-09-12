import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS, deleteFileFromGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

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

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found or access denied' }, { status: 404 });
    }

    if (auth.role === 'EMPLOYEE' && auth.employeeId && doc.employeeId !== auth.employeeId) {
      return NextResponse.json({ success: false, message: 'Forbidden. Access restricted to target employee.' }, { status: 403 });
    }

    const documentData = {
      id: doc._id.toString(),
      organizationId: doc.organizationId || auth.organizationId,
      title: doc.title,
      employeeId: doc.employeeId,
      employeeName: doc.employeeName,
      category: doc.category,
      fileName: doc.fileName || doc.originalFileName,
      originalFileName: doc.originalFileName || doc.fileName,
      fileSize: doc.fileSize || formatBytes(doc.fileSizeBytes || 0),
      fileSizeBytes: doc.fileSizeBytes || 0,
      mimeType: doc.mimeType || 'application/pdf',
      fileId: doc.gridFsFileId || doc.fileId || '',
      gridFsFileId: doc.gridFsFileId || doc.fileId || '',
      fileUrl: `/api/v1/documents/${doc._id.toString()}/file`,
      accessRole: doc.accessRole,
      uploadedBy: doc.uploadedBy,
      uploadDate: doc.uploadDate || doc.uploadedAt?.split('T')[0],
      updatedAt: doc.updatedAt,
    };

    return NextResponse.json({ success: true, document: documentData });
  } catch (error: any) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error fetching document' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid document ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const existingDoc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      organizationId: auth.organizationId,
    });

    if (!existingDoc) {
      return NextResponse.json({ success: false, message: 'Document not found or access denied' }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const employeeId = formData.get('employeeId') as string;
    const employeeName = formData.get('employeeName') as string;
    const category = formData.get('category') as string;
    const accessRole = formData.get('accessRole') as string;

    const updateFields: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title && title.trim()) updateFields.title = title.trim();
    if (employeeId) updateFields.employeeId = employeeId;
    if (employeeName) updateFields.employeeName = employeeName;
    if (category) updateFields.category = category;
    if (accessRole) updateFields.accessRole = accessRole;

    // Optional GridFS binary file replacement
    if (file && file.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) && !file.name.endsWith('.pdf')) {
        return NextResponse.json(
          { success: false, message: 'Invalid replacement file type. Allowed: PDF, PNG, JPG, WEBP, DOC, DOCX.' },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: `File size (${formatBytes(file.size)}) exceeds the 15 MB limit.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload new file to GridFS
      const newFileId = await uploadFileToGridFS(
        file.name,
        file.type || 'application/octet-stream',
        buffer,
        'documents'
      );

      // Delete old file from GridFS to prevent orphan storage
      const oldFileId = existingDoc.gridFsFileId || existingDoc.fileId;
      if (oldFileId) {
        await deleteFileFromGridFS(oldFileId, 'documents');
      }

      updateFields.gridFsFileId = newFileId;
      updateFields.fileId = newFileId;
      updateFields.fileName = file.name;
      updateFields.originalFileName = file.name;
      updateFields.fileSizeBytes = file.size;
      updateFields.fileSize = formatBytes(file.size);
      updateFields.mimeType = file.type || 'application/octet-stream';
    }

    await db.collection('documents').updateOne({ _id: new ObjectId(id) }, { $set: updateFields });

    const updatedDoc = await db.collection('documents').findOne({ _id: new ObjectId(id) });

    const mappedDocument = {
      id: updatedDoc!._id.toString(),
      organizationId: updatedDoc!.organizationId || auth.organizationId,
      title: updatedDoc!.title,
      employeeId: updatedDoc!.employeeId,
      employeeName: updatedDoc!.employeeName,
      category: updatedDoc!.category,
      fileName: updatedDoc!.fileName || updatedDoc!.originalFileName,
      originalFileName: updatedDoc!.originalFileName || updatedDoc!.fileName,
      fileSize: updatedDoc!.fileSize || formatBytes(updatedDoc!.fileSizeBytes || 0),
      fileSizeBytes: updatedDoc!.fileSizeBytes || 0,
      mimeType: updatedDoc!.mimeType || 'application/pdf',
      fileId: updatedDoc!.gridFsFileId || updatedDoc!.fileId || '',
      gridFsFileId: updatedDoc!.gridFsFileId || updatedDoc!.fileId || '',
      fileUrl: `/api/v1/documents/${updatedDoc!._id.toString()}/file`,
      accessRole: updatedDoc!.accessRole,
      uploadedBy: updatedDoc!.uploadedBy,
      uploadDate: updatedDoc!.uploadDate || updatedDoc!.uploadedAt?.split('T')[0],
      updatedAt: updatedDoc!.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: `Document "${mappedDocument.title}" updated successfully!`,
      document: mappedDocument,
    });
  } catch (error: any) {
    console.error('Error updating document:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error updating document' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: 'Invalid document ID' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      organizationId: auth.organizationId,
    });

    if (!doc) {
      return NextResponse.json({ success: false, message: 'Document not found or access denied' }, { status: 404 });
    }

    // 1. Delete associated binary file from GridFS
    const targetFileId = doc.gridFsFileId || doc.fileId;
    if (targetFileId) {
      await deleteFileFromGridFS(targetFileId, 'documents');
    }

    // 2. Delete metadata record from MongoDB Atlas
    await db.collection('documents').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: `Document "${doc.title}" deleted from MongoDB Atlas & GridFS storage cleaned.`,
    });
  } catch (error: any) {
    console.error('Error deleting document from MongoDB Atlas:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to delete document' }, { status: 500 });
  }
}
