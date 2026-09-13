import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { hashPassword } from '@/lib/cryptoAuth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const now = new Date();

    // 1. Secret Key Check if configured in environment
    const requiredSecret = process.env.SUPER_ADMIN_BOOTSTRAP_SECRET;
    const clientSecret = req.headers.get('x-bootstrap-secret') || req.headers.get('authorization')?.replace('Bearer ', '');

    // Read body once
    const body = await req.json().catch(() => ({}));
    const providedSecret = clientSecret || body.bootstrapSecret;

    if (requiredSecret && providedSecret !== requiredSecret) {
      return NextResponse.json(
        { success: false, message: 'Super Admin bootstrap is no longer available.' },
        { status: 403 }
      );
    }

    // 2. One-time Initialization Check: Block permanently if ANY Super Admin already exists
    const existingSuperAdmin = await db.collection('users').findOne({ role: 'SUPER_ADMIN' });
    if (existingSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Super Admin bootstrap is no longer available.',
        },
        { status: 403 }
      );
    }
    const { name, email, password, organizationName } = body;
    const cleanEmail = email ? email.trim().toLowerCase() : null;

    if (!name || !cleanEmail || !password) {
      return NextResponse.json(
        { success: false, message: 'Name, official email address, and strong password are required for initial Super Admin setup.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Initial Super Admin password must be at least 8 characters long for security compliance.' },
        { status: 400 }
      );
    }

    const orgId = 'org-master';
    const orgTitle = organizationName || 'Master Organization';

    // Ensure Organization Record exists
    await db.collection('organizations').updateOne(
      { id: orgId },
      {
        $set: {
          id: orgId,
          name: orgTitle,
          code: 'MST',
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    const employeeId = 'EMP-SA01';
    const { formatted, salt } = hashPassword(password);

    // Create Initial Super Admin User Document
    const superAdminUser = {
      id: `usr-sa-${Date.now()}`,
      employeeId,
      name: name.trim(),
      email: cleanEmail,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      role: 'SUPER_ADMIN',
      organizationId: orgId,
      department: 'Executive Board',
      designation: 'Super Administrator',
      passwordHash: formatted,
      salt,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerificationStatus: 'VERIFIED',
      isTwoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').updateOne(
      { email: cleanEmail },
      { $set: superAdminUser, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Create Initial Super Admin Employee Document
    const superAdminEmp = {
      organizationId: orgId,
      employeeId,
      firstName: name.trim().split(' ')[0] || name.trim(),
      lastName: name.trim().split(' ').slice(1).join(' ') || 'Admin',
      email: cleanEmail,
      phone: '',
      department: 'Executive Board',
      designation: 'Super Administrator',
      role: 'SUPER_ADMIN',
      status: 'Active',
      joiningDate: now.toISOString().split('T')[0],
      location: 'Global Operations Hub',
      managerId: '',
      avatar: superAdminUser.avatar,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').updateOne(
      { organizationId: orgId, employeeId },
      { $set: superAdminEmp, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    await logAuditEvent(req, 'SUPER_ADMIN_BOOTSTRAPPED', {
      employeeId,
      details: { email: cleanEmail, role: 'SUPER_ADMIN', organizationId: orgId },
    });

    return NextResponse.json({
      success: true,
      message: 'Initial Super Admin account bootstrapped successfully! You may now sign in.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/auth/bootstrap-super-admin:', error);
    return NextResponse.json(
      { success: false, message: 'Super Admin bootstrap failed due to a server error.' },
      { status: 500 }
    );
  }
}
