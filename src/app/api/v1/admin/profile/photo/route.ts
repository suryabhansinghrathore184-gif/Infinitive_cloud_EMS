import { NextRequest, NextResponse } from 'next/server';
import {
  uploadFileToGridFS,
  getFileStreamFromGridFS,
  deleteFileFromGridFS,
  connectToDatabase,
} from '@/lib/mongodb';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80';

// 1. POST: Upload Profile Image to MongoDB GridFS
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const previousFileId = formData.get('previousFileId') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No image file uploaded.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file format. Only JPG, JPEG, PNG, and WEBP images are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate File Size (<= 5 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `File size exceeds maximum 5 MB limit. Selected file is ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB.`,
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Delete previous GridFS file if updating
    if (previousFileId) {
      await deleteFileFromGridFS(previousFileId);
    }

    // Save binary stream in MongoDB GridFS photos bucket
    const fileId = await uploadFileToGridFS(file.name, file.type, buffer);
    const photoUrl = `/api/v1/admin/profile/photo?id=${fileId}`;

    // Update Admin User Document in MongoDB
    try {
      const { db } = await connectToDatabase();
      await db.collection('users').updateOne(
        { role: { $regex: /admin/i } },
        {
          $set: {
            profilePhotoId: fileId,
            avatar: photoUrl,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (dbError) {
      console.warn('Could not update Admin user document in DB:', dbError);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile photo uploaded successfully to MongoDB GridFS!',
      fileId,
      photoUrl,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/admin/profile/photo:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Failed to upload image to MongoDB GridFS.',
      },
      { status: 500 }
    );
  }
}

// 2. GET: Stream binary image from MongoDB GridFS
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let fileId = searchParams.get('id');

    // If no ID in searchParams, check MongoDB admin user document for photo ID
    if (!fileId) {
      try {
        const { db } = await connectToDatabase();
        const adminUser = await db
          .collection('users')
          .findOne({ role: { $regex: /admin/i } });
        if (adminUser && adminUser.profilePhotoId) {
          fileId = adminUser.profilePhotoId;
        }
      } catch (err) {
        console.warn('Failed reading admin photo ID from DB:', err);
      }
    }

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: 'Photo ID is missing or not found.' },
        { status: 404 }
      );
    }

    const fileResult = await getFileStreamFromGridFS(fileId);
    if (!fileResult) {
      return NextResponse.json(
        { success: false, message: 'Image binary not found in MongoDB GridFS.' },
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
    console.error('Error in GET /api/v1/admin/profile/photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve photo from GridFS.' },
      { status: 500 }
    );
  }
}

// 3. DELETE: Remove image from MongoDB GridFS & reset to default avatar
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let fileId = searchParams.get('id');

    const { db } = await connectToDatabase();

    if (!fileId) {
      const adminUser = await db
        .collection('users')
        .findOne({ role: { $regex: /admin/i } });
      if (adminUser && adminUser.profilePhotoId) {
        fileId = adminUser.profilePhotoId;
      }
    }

    if (fileId) {
      await deleteFileFromGridFS(fileId);
    }

    // Reset user avatar reference in MongoDB
    try {
      await db.collection('users').updateOne(
        { role: { $regex: /admin/i } },
        {
          $unset: { profilePhotoId: '' },
          $set: { avatar: DEFAULT_AVATAR, updatedAt: new Date() },
        }
      );
    } catch (dbErr) {
      console.warn('Could not reset Admin user document in DB:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile photo removed from MongoDB GridFS successfully.',
      defaultAvatar: DEFAULT_AVATAR,
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/admin/profile/photo:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete photo from GridFS.' },
      { status: 500 }
    );
  }
}
