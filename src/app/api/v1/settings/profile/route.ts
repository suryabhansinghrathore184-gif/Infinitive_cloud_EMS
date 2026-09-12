import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80';

// GET /api/v1/settings/profile - Fetch authenticated user profile
export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const { db } = await connectToDatabase();

    let userDoc: any = await db.collection('users').findOne({
      $or: [{ userId: auth.userId }, { id: auth.userId }, { email: auth.email }],
    });

    if (!userDoc) {
      const newDoc = {
        userId: auth.userId,
        email: auth.email,
        name: auth.name || 'Admin User',
        role: auth.role || 'ADMIN',
        roleTitle: 'HR Administrator',
        phone: '+91 98765 43210',
        avatar: DEFAULT_AVATAR,
        organizationId: auth.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection('users').insertOne(newDoc as any);
      userDoc = newDoc;
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userDoc?.userId || userDoc?.id || auth.userId,
        fullName: userDoc?.fullName || userDoc?.name || auth.name,
        email: userDoc?.email || auth.email,
        roleTitle: userDoc?.roleTitle || userDoc?.designation || 'HR Administrator',
        phone: userDoc?.phone || '',
        avatar: userDoc?.avatar || DEFAULT_AVATAR,
        role: userDoc?.role || auth.role,
        profilePhotoId: userDoc?.profilePhotoId || null,
        organizationId: userDoc?.organizationId || auth.organizationId,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/v1/settings/profile:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch admin profile.' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/settings/profile - Update authenticated user profile
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json(
        { success: false, message: perm.message },
        { status: perm.statusCode }
      );
    }

    const body = await req.json();
    const { fullName, roleTitle, phone } = body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json(
        { success: false, message: 'Full name is required and cannot be empty.' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    const updateFields: any = {
      name: fullName.trim(),
      fullName: fullName.trim(),
      roleTitle: roleTitle ? String(roleTitle).trim() : 'HR Administrator',
      phone: phone ? String(phone).trim() : '',
      updatedAt: now,
    };

    const filter = {
      $or: [{ userId: auth.userId }, { id: auth.userId }, { email: auth.email }],
    };

    const updateResult = await db.collection('users').updateOne(filter, {
      $set: updateFields,
    });

    if (updateResult.matchedCount === 0) {
      await db.collection('users').insertOne({
        userId: auth.userId,
        email: auth.email,
        role: auth.role || 'ADMIN',
        organizationId: auth.organizationId,
        avatar: DEFAULT_AVATAR,
        createdAt: now,
        ...updateFields,
      } as any);
    }

    await logAuditEvent(req, 'UPDATE_ADMIN_PROFILE', {
      details: { userId: auth.userId, email: auth.email, updates: updateFields },
    });

    const updatedUser: any = await db.collection('users').findOne(filter);

    return NextResponse.json({
      success: true,
      message: 'Admin Profile updated successfully.',
      data: {
        userId: updatedUser?.userId || auth.userId,
        fullName: updatedUser?.fullName || updatedUser?.name || fullName,
        email: updatedUser?.email || auth.email,
        roleTitle: updatedUser?.roleTitle || roleTitle,
        phone: updatedUser?.phone || phone,
        avatar: updatedUser?.avatar || DEFAULT_AVATAR,
        role: updatedUser?.role || auth.role,
        profilePhotoId: updatedUser?.profilePhotoId || null,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/v1/settings/profile:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update admin profile.' },
      { status: 500 }
    );
  }
}
