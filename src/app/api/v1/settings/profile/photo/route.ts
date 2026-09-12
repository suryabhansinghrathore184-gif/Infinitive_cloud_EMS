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
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80';

// POST /api/v1/settings/profile/photo - Upload Profile Image to MongoDB GridFS
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const previousFileId = formData.get('previousFileId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file selected.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are supported.',
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          message: `File size (${sizeMb} MB) exceeds the maximum 5 MB limit.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (previousFileId) {
      try {
        await deleteFileFromGridFS(previousFileId);
      } catch (delErr) {
        console.warn('Could not delete old GridFS photo:', delErr);
      }
    }

    const fileId = await uploadFileToGridFS(file.name, file.type, buffer);
    const photoUrl = `/api/v1/settings/profile/photo?id=${fileId}`;

    const { db } = await connectToDatabase();
    const now = new Date();

    const userFilter = {
      $or: [{ userId: auth.userId }, { id: auth.userId }, { email: auth.email }],
    };

    await db.collection('users').updateOne(
      userFilter,
      {
        $set: {
          profilePhotoId: fileId,
          avatar: photoUrl,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    await logAuditEvent(req, 'UPLOAD_PROFILE_PHOTO', {
      details: { userId: auth.userId, fileId, filename: file.name, size: file.size },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully to MongoDB GridFS!',
      fileId,
      photoUrl,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/settings/profile/photo:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to upload photo to MongoDB GridFS.' },
      { status: 500 }
    );
  }
}

// GET /api/v1/settings/profile/photo - Stream binary photo from MongoDB GridFS
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const { searchParams } = new URL(req.url);
    let fileId = searchParams.get('id');

    const { db } = await connectToDatabase();

    if (!fileId) {
      const userDoc = await db.collection('users').findOne({
        $or: [{ userId: auth.userId }, { id: auth.userId }, { email: auth.email }],
      });
      if (userDoc && userDoc.profilePhotoId) {
        fileId = userDoc.profilePhotoId;
      }
    }

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'Profile photo ID not found.' },
        { status: 404 }
      );
    }

    const fileResult = await getFileStreamFromGridFS(fileId);
    if (!fileResult) {
      return NextResponse.json(
        { success: false, message: 'Image binary not found in GridFS storage.' },
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
    console.error('Error in GET /api/v1/settings/profile/photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve photo from GridFS.' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/settings/profile/photo - Remove profile photo from MongoDB GridFS
export async function DELETE(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { searchParams } = new URL(req.url);
    let fileId = searchParams.get('id');

    const { db } = await connectToDatabase();
    const userFilter = {
      $or: [{ userId: auth.userId }, { id: auth.userId }, { email: auth.email }],
    };

    if (!fileId) {
      const userDoc = await db.collection('users').findOne(userFilter);
      if (userDoc && userDoc.profilePhotoId) {
        fileId = userDoc.profilePhotoId;
      }
    }

    if (fileId) {
      try {
        await deleteFileFromGridFS(fileId);
      } catch (delErr) {
        console.warn('Could not delete GridFS file:', delErr);
      }
    }

    await db.collection('users').updateOne(userFilter, {
      $unset: { profilePhotoId: '' },
      $set: { avatar: DEFAULT_AVATAR, updatedAt: new Date() },
    });

    await logAuditEvent(req, 'REMOVE_PROFILE_PHOTO', {
      details: { userId: auth.userId, fileId },
    });

    return NextResponse.json({
      success: true,
      message: 'Profile photo removed from MongoDB GridFS successfully.',
      defaultAvatar: DEFAULT_AVATAR,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/settings/profile/photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete photo from GridFS.' },
      { status: 500 }
    );
  }
}
