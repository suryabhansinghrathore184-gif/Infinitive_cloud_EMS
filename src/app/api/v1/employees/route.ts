import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { generateNumericOTP, hashToken, hashPassword } from '@/lib/cryptoAuth';
import { sendOtpEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10))) : 0;
    const search = searchParams.get('search')?.trim() || '';
    const department = searchParams.get('department')?.trim();
    const status = searchParams.get('status')?.trim();

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let filter: any = { organizationId: orgId };

    // RBAC: MANAGER role can only see direct report team members
    if (auth.role === 'MANAGER' && auth.employeeId) {
      filter.$or = [
        { managerId: auth.employeeId },
        { reportingTo: auth.employeeId },
        { employeeId: auth.employeeId },
      ];
    } else if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      filter.employeeId = auth.employeeId;
    }

    if (department && department !== 'All') {
      filter.department = department;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { employeeId: regex },
        { email: regex },
        { department: regex },
        { designation: regex },
      ];
    }

    const totalCount = await db.collection('employees').countDocuments(filter);

    let queryCursor = db
      .collection('employees')
      .find(filter)
      .sort({ createdAt: -1, _id: -1 });

    if (limit > 0) {
      queryCursor = queryCursor.skip((page - 1) * limit).limit(limit);
    }

    const employees = await queryCursor.toArray();

    return NextResponse.json({
      success: true,
      data: employees,
      pagination: {
        total: totalCount,
        page: limit > 0 ? page : 1,
        limit: limit > 0 ? limit : totalCount,
        totalPages: limit > 0 ? Math.ceil(totalCount / limit) : 1,
      },
    });
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch employees list.' },
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

    const body = await req.json();
    const { firstName, lastName, email, department, designation, role, phone, joiningDate, salary, location, managerId } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ success: false, message: 'First name, last name, and email address are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const requestedRole = (role || 'EMPLOYEE').toUpperCase();
    const validRoles = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN', 'SUPER_ADMIN'];

    if (!validRoles.includes(requestedRole)) {
      return NextResponse.json({ success: false, message: `Invalid account role: ${role}` }, { status: 400 });
    }

    // Role Security: Admin/HR users cannot create SUPER_ADMIN accounts
    if (requestedRole === 'SUPER_ADMIN' && auth.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only a Super Admin can create accounts with the SUPER_ADMIN role.' },
        { status: 403 }
      );
    }

    // Tenant Isolation: Force organizationId from server auth context for Admin/HR callers
    let orgId = auth.organizationId;
    if (auth.role === 'SUPER_ADMIN' && body.organizationId) {
      orgId = body.organizationId;
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    // Case-insensitive Duplicate Email & Employee Profile Check
    const existingUser = await db.collection('users').findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: `Employee profile or account already exists for email "${cleanEmail}".` },
        { status: 409 }
      );
    }

    const empCount = await db.collection('employees').countDocuments({ organizationId: orgId });
    const employeeId = body.employeeId?.trim() || `EMP-${String(empCount + 101).padStart(3, '0')}`;

    const existingEmpId = await db.collection('employees').findOne({ organizationId: orgId, employeeId });
    if (existingEmpId) {
      return NextResponse.json(
        { success: false, message: `Employee ID "${employeeId}" already exists in this organization.` },
        { status: 409 }
      );
    }

    // Server-Side Manager Validation (Prevent cross-tenant assignment & self-reporting)
    let validatedManagerId = '';
    if (managerId && managerId.trim()) {
      const cleanMgr = managerId.trim();
      if (cleanMgr === employeeId || cleanMgr === cleanEmail) {
        return NextResponse.json(
          { success: false, message: 'An employee cannot be assigned as their own reporting manager.' },
          { status: 400 }
        );
      }

      const managerRecord = await db.collection('employees').findOne({
        organizationId: orgId,
        $or: [{ employeeId: cleanMgr }, { id: cleanMgr }, { email: cleanMgr.toLowerCase() }],
      });

      if (!managerRecord) {
        return NextResponse.json(
          { success: false, message: 'The specified Reporting Manager does not exist within your organization.' },
          { status: 400 }
        );
      }
      validatedManagerId = managerRecord.employeeId || cleanMgr;
    }

    const employeeDoc = {
      organizationId: orgId,
      employeeId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '',
      department: department || 'General',
      designation: designation || 'Staff',
      role: requestedRole,
      status: 'Active',
      joiningDate: joiningDate || now.toISOString().split('T')[0],
      location: location || 'Headquarters',
      managerId: validatedManagerId,
      avatar: body.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').updateOne(
      { organizationId: orgId, employeeId },
      { $set: employeeDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Create user record in users collection with emailVerified: false & PENDING_VERIFICATION
    const rawPass = body.password || 'emp123';
    const { formatted, salt } = hashPassword(rawPass);
    const userDoc = {
      id: `usr-${employeeId.toLowerCase()}`,
      employeeId,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: cleanEmail,
      avatar: employeeDoc.avatar,
      role: requestedRole,
      organizationId: orgId,
      department: employeeDoc.department,
      designation: employeeDoc.designation,
      passwordHash: formatted,
      salt,
      status: 'PENDING_VERIFICATION',
      emailVerified: false,
      emailVerificationStatus: 'PENDING_VERIFICATION',
      isTwoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('users').updateOne(
      { email: cleanEmail },
      { $set: userDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Auto-create default salary assignment if salary is specified
    if (salary) {
      await db.collection('salary_assignments').updateOne(
        { organizationId: orgId, employeeId, status: 'Active' },
        {
          $set: {
            organizationId: orgId,
            employeeId,
            salaryStructureId: 'struct-std',
            basicSalary: Number(salary) * 0.6 || 50000,
            hra: Number(salary) * 0.2 || 20000,
            conveyance: 3000,
            medical: 2000,
            specialAllowance: 5000,
            effectiveFrom: now,
            status: 'Active',
            assignedBy: auth.email || auth.userId,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
    }

    // Generate cryptographically secure 6-digit OTP using crypto.randomInt(100000, 1000000)
    const rawOtp = generateNumericOTP(6);
    const otpHash = hashToken(rawOtp);
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes TTL

    // Invalidate existing unused verification tokens for this email
    await db.collection('auth_otp_tokens').deleteMany({
      email: cleanEmail,
      purpose: 'EMAIL_VERIFICATION',
    });

    // Store SHA-256 hashed OTP in auth_otp_tokens
    await db.collection('auth_otp_tokens').insertOne({
      userId: employeeId,
      email: cleanEmail,
      organizationId: orgId,
      otpHash,
      purpose: 'EMAIL_VERIFICATION',
      expiresAt,
      attempts: 0,
      createdAt: now,
    });

    // Dispatch real email via Nodemailer Gmail SMTP
    const emailResult = await sendOtpEmail({
      to: cleanEmail,
      otp: rawOtp,
      purpose: 'EMAIL_VERIFICATION',
      userName: `${firstName.trim()} ${lastName.trim()}`,
    });

    // Audit Logging per Section 15
    await logAuditEvent(req, 'ACCOUNT_CREATED', {
      employeeId,
      details: {
        actorId: auth.userId,
        actorRole: auth.role,
        organizationId: orgId,
        targetUserId: userDoc.id,
        targetEmployeeId: employeeId,
        role: requestedRole,
        email: cleanEmail,
      },
    });

    await logAuditEvent(req, 'ADD_EMPLOYEE', { employeeId, details: employeeDoc });
    await logAuditEvent(req, 'OTP_REQUESTED', { details: { email: cleanEmail, purpose: 'EMAIL_VERIFICATION', emailDelivered: emailResult.success } });

    const newEmp = await db.collection('employees').findOne({ organizationId: orgId, employeeId });

    if (!emailResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Account created, but the verification email could not be sent. Please resend the verification email.',
        data: newEmp,
        emailVerificationSent: false,
        email: cleanEmail,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Account created successfully. Verification email sent to ${cleanEmail}.`,
      data: newEmp,
      emailVerificationSent: true,
      email: cleanEmail,
    });
  } catch (error: any) {
    console.error('Error in POST /api/v1/employees:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create account record.' },
      { status: 500 }
    );
  }
}
