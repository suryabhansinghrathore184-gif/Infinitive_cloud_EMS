import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

// GET /api/v1/super-admin/users/[id] - Get detailed single user profile & active sessions
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const userId = params.id;
    const { db } = await connectToDatabase();
    const now = new Date();

    let query: any = {};
    if (ObjectId.isValid(userId)) {
      query.$or = [{ _id: new ObjectId(userId) }, { id: userId }, { email: userId }];
    } else {
      query.$or = [{ id: userId }, { email: userId }];
    }

    // Explicitly exclude passwords, hashes, salts, and secrets
    const userDoc = await db.collection('users').findOne(query, {
      projection: { password: 0, passwordHash: 0, salt: 0, otp: 0, secret: 0 },
    });

    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User record not found' }, { status: 404 });
    }

    // Fetch matching employee record if available
    const empDoc = await db.collection('employees').findOne(
      { $or: [{ email: userDoc.email }, { employeeId: userDoc.employeeId }] },
      { projection: { password: 0 } }
    );

    // Fetch active session tokens from authoritative user_sessions collection
    const activeSessionsDocs = await db
      .collection('user_sessions')
      .find({
        $or: [{ userId: userDoc.id }, { email: userDoc.email }],
        expiresAt: { $gt: now },
        status: 'ACTIVE',
      })
      .toArray();

    // Map sessions securely without revealing token values
    const safeSessions = activeSessionsDocs.map((s) => ({
      id: s._id.toString(),
      type: 'ACTIVE_SESSION',
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : now.toISOString(),
      expiresAt: s.expiresAt ? new Date(s.expiresAt).toISOString() : now.toISOString(),
      ipAddress: s.ipAddress || '127.0.0.1',
      userAgent: s.userAgent || 'Web Browser',
      status: 'Active',
    }));

    // Fetch organization info
    const orgDoc = await db.collection('organization_settings').findOne({
      $or: [{ organizationId: userDoc.organizationId }, { 'organization.code': userDoc.organizationId }],
    });

    const orgDetails = orgDoc?.organization || {};

    const profileData = {
      id: userDoc._id.toString(),
      userId: userDoc.id || userDoc._id.toString(),
      employeeId: userDoc.employeeId || empDoc?.employeeId || 'N/A',
      name: userDoc.name || userDoc.fullName || `${empDoc?.firstName || ''} ${empDoc?.lastName || ''}`.trim() || 'User Account',
      email: userDoc.email,
      role: userDoc.role || 'EMPLOYEE',
      organizationId: userDoc.organizationId || 'org-default',
      organizationName: orgDetails.name || orgDoc?.name || 'Infinitive Cloud Solutions',
      organizationCode: orgDetails.code || orgDoc?.code || 'ICS-HQ',
      status: userDoc.status || 'Active',
      emailVerificationStatus: userDoc.emailVerificationStatus || (userDoc.emailVerified ? 'VERIFIED' : 'PENDING'),
      emailVerified: !!userDoc.emailVerified || userDoc.emailVerificationStatus === 'VERIFIED',
      isTwoFactorEnabled: !!userDoc.isTwoFactorEnabled,
      avatar: userDoc.avatar || empDoc?.avatar || '',
      lastLogin: userDoc.lastLogin || userDoc.updatedAt || userDoc.createdAt || 'Never',
      createdAt: userDoc.createdAt || new Date().toISOString(),
      updatedAt: userDoc.updatedAt || new Date().toISOString(),
      activeSessionsCount: safeSessions.length,
      activeSessions: safeSessions,
    };

    return NextResponse.json({ success: true, data: profileData });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch user profile' }, { status: 500 });
  }
}

// PATCH /api/v1/super-admin/users/[id] - Update User Role, Status, or Organization
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const userId = params.id;
    const body = await req.json();
    const { role, status, organizationId } = body;

    const { db } = await connectToDatabase();
    const now = new Date().toISOString();

    let query: any = {};
    if (ObjectId.isValid(userId)) {
      query.$or = [{ _id: new ObjectId(userId) }, { id: userId }, { email: userId }];
    } else {
      query.$or = [{ id: userId }, { email: userId }];
    }

    const userDoc = await db.collection('users').findOne(query);

    if (!userDoc) {
      return NextResponse.json({ success: false, message: 'User record not found' }, { status: 404 });
    }

    const currentRole = userDoc.role;
    const currentStatus = userDoc.status;
    const isTargetSuperAdmin = currentRole === 'SUPER_ADMIN';

    // 1. PREVENT LAST SUPER ADMIN LOCKOUT / DEMOTION
    const isDemotingSuperAdmin = isTargetSuperAdmin && role && role !== 'SUPER_ADMIN';
    const isDisablingSuperAdmin =
      isTargetSuperAdmin && status && ['INACTIVE', 'Inactive', 'Disabled', 'LOCKED', 'Locked', 'Suspended'].includes(status);

    if (isDemotingSuperAdmin || isDisablingSuperAdmin) {
      const activeSuperAdminCount = await db.collection('users').countDocuments({
        role: 'SUPER_ADMIN',
        status: { $in: ['ACTIVE', 'Active'] },
      });

      if (activeSuperAdminCount <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Cannot complete this action because at least one active Super Admin account must remain in the system.',
          },
          { status: 400 }
        );
      }
    }

    // 2. Prepare Updates
    const updateFields: any = { updatedAt: now };
    let actionType = 'USER_UPDATED';

    if (role) {
      updateFields.role = role;
      actionType = 'USER_ROLE_CHANGED';
    }

    if (status) {
      updateFields.status = status;
      if (status === 'Active' || status === 'ACTIVE') actionType = 'USER_ACTIVATED';
      else if (status === 'Inactive' || status === 'INACTIVE') actionType = 'USER_DEACTIVATED';
      else if (status === 'Locked' || status === 'LOCKED' || status === 'Suspended') actionType = 'USER_LOCKED';
    }

    if (organizationId) {
      updateFields.organizationId = organizationId;
      actionType = 'USER_ORGANIZATION_CHANGED';
    }

    // Update user document
    await db.collection('users').updateOne({ _id: userDoc._id }, { $set: updateFields });

    // Sync role/status/organization to employees collection if linked
    await db.collection('employees').updateMany(
      { $or: [{ email: userDoc.email }, { employeeId: userDoc.employeeId }] },
      { $set: updateFields }
    );

    // Audit Log
    await logAuditEvent(req, actionType, {
      details: {
        targetUserId: userDoc.id || userDoc._id.toString(),
        targetEmail: userDoc.email,
        oldRole: currentRole,
        newRole: role || currentRole,
        oldStatus: currentStatus,
        newStatus: status || currentStatus,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User record updated successfully.`,
      data: { userId, ...updateFields },
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update user' }, { status: 500 });
  }
}
