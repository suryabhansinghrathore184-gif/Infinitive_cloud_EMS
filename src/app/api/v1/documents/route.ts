import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';
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

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const category = searchParams.get('category') || '';
    const accessRole = searchParams.get('accessRole') || '';
    const employeeId = searchParams.get('employeeId') || '';

    // Enforce multi-tenant organization isolation
    const filter: any = {
      organizationId: auth.organizationId,
    };

    // Employee role restriction
    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      filter.$or = [
        { employeeId: auth.employeeId },
        { accessRole: { $in: ['Employee', 'Public', 'HR & Admin'] } },
      ];
    }

    if (category && category !== 'All') {
      filter.category = category;
    }
    if (accessRole && accessRole !== 'All') {
      filter.accessRole = accessRole;
    }
    if (employeeId) {
      filter.employeeId = employeeId;
    }

    let documents = await db
      .collection('documents')
      .find(filter)
      .sort({ uploadedAt: -1, _id: -1 })
      .toArray();

    if (q) {
      documents = documents.filter(
        (doc: any) =>
          doc.title?.toLowerCase().includes(q) ||
          doc.employeeName?.toLowerCase().includes(q) ||
          doc.fileName?.toLowerCase().includes(q) ||
          doc.category?.toLowerCase().includes(q)
      );
    }

    const mappedDocuments = documents.map((doc: any) => ({
      id: doc._id.toString(),
      organizationId: doc.organizationId || auth.organizationId,
      title: doc.title || 'Untitled Document',
      employeeId: doc.employeeId || 'EMP-GEN',
      employeeName: doc.employeeName || 'General Record',
      category: doc.category || 'Other',
      fileName: doc.fileName || doc.originalFileName || 'document.pdf',
      originalFileName: doc.originalFileName || doc.fileName || 'document.pdf',
      fileSize: doc.fileSize || formatBytes(doc.fileSizeBytes || 0),
      fileSizeBytes: doc.fileSizeBytes || 0,
      mimeType: doc.mimeType || 'application/pdf',
      fileId: doc.gridFsFileId || doc.fileId || '',
      gridFsFileId: doc.gridFsFileId || doc.fileId || '',
      fileUrl: `/api/v1/documents/${doc._id.toString()}/file`,
      accessRole: doc.accessRole || 'HR Only',
      uploadedBy: doc.uploadedBy || 'HR Administrator',
      uploadDate: doc.uploadDate || doc.uploadedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      createdAt: doc.createdAt || doc.uploadedAt || new Date().toISOString(),
      updatedAt: doc.updatedAt || doc.uploadDate,
    }));

    return NextResponse.json({ success: true, documents: mappedDocuments });
  } catch (error: any) {
    console.error('Error fetching documents from MongoDB Atlas:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch documents from database' },
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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const employeeId = (formData.get('employeeId') as string) || 'EMP-GEN';
    const employeeName = (formData.get('employeeName') as string) || 'General Record';
    const category = (formData.get('category') as string) || 'Other';
    const accessRole = (formData.get('accessRole') as string) || 'HR Only';
    const uploadedBy = (formData.get('uploadedBy') as string) || auth.name || 'HR Administrator';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Please select a file to upload.' },
        { status: 400 }
      );
    }

    if (!title.trim()) {
      return NextResponse.json(
        { success: false, message: 'Document Title is required.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase()) && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Unsupported file format. Please upload a PDF, PNG, JPG, WEBP, DOC, or DOCX document.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size (${formatBytes(file.size)}) exceeds the maximum 15 MB limit.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Stream binary file to MongoDB GridFS
    const gridFsFileId = await uploadFileToGridFS(
      file.name,
      file.type || 'application/octet-stream',
      buffer,
      'documents'
    );

    const { db } = await connectToDatabase();
    const nowISO = new Date().toISOString();
    const dateFormatted = nowISO.split('T')[0];

    const documentDoc = {
      organizationId: auth.organizationId,
      title: title.trim(),
      employeeId,
      employeeName,
      category,
      fileName: file.name,
      originalFileName: file.name,
      fileSizeBytes: file.size,
      fileSize: formatBytes(file.size),
      mimeType: file.type || 'application/octet-stream',
      gridFsFileId,
      fileId: gridFsFileId,
      accessRole,
      uploadedBy,
      uploadDate: dateFormatted,
      uploadedAt: nowISO,
      createdAt: nowISO,
      updatedAt: nowISO,
    };

    const result = await db.collection('documents').insertOne(documentDoc);
    const docId = result.insertedId.toString();

    const createdDocument = {
      id: docId,
      ...documentDoc,
      fileUrl: `/api/v1/documents/${docId}/file`,
    };

    return NextResponse.json({
      success: true,
      message: `Document "${title}" uploaded to MongoDB Atlas GridFS successfully!`,
      document: createdDocument,
    });
  } catch (error: any) {
    console.error('Error uploading document to MongoDB Atlas:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to upload document.' },
      { status: 500 }
    );
  }
}
