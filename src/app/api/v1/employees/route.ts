import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

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

    const employees = await db.collection('employees').find(filter).toArray();

    return NextResponse.json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch employees' }, { status: 500 });
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
      return NextResponse.json({ success: false, message: 'First name, last name, and email are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const empCount = await db.collection('employees').countDocuments({ organizationId: orgId });
    const employeeId = body.employeeId || `EMP-${String(empCount + 101).padStart(3, '0')}`;

    const employeeDoc = {
      organizationId: orgId,
      employeeId,
      firstName,
      lastName,
      email,
      phone: phone || '',
      department: department || 'General',
      designation: designation || 'Staff',
      role: role || 'EMPLOYEE',
      status: 'Active',
      joiningDate: joiningDate || now.toISOString().split('T')[0],
      location: location || 'Headquarters',
      managerId: managerId || '',
      avatar: body.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').updateOne(
      { organizationId: orgId, employeeId },
      { $set: employeeDoc, $setOnInsert: { createdAt: now } },
      { upsert: true }
    );

    // Also auto-create default salary assignment if salary is specified
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

    await logAuditEvent(req, 'ADD_EMPLOYEE', { employeeId, details: employeeDoc });

    // Trigger Notification for new employee creation
    try {
      const { createNotification } = await import('@/lib/notifications/notificationService');
      await createNotification({
        organizationId: orgId,
        recipientType: 'EMPLOYEE',
        recipientId: employeeId,
        eventType: 'employee_added',
        category: 'HR_EMPLOYEE',
        title: `Welcome ${firstName} ${lastName}!`,
        message: `Your employee profile has been created with Employee ID: ${employeeId}.`,
        priority: 'NORMAL',
        actionUrl: '/employee/dashboard',
        recipientEmail: email,
        recipientPhone: phone || undefined,
      });
    } catch (notifErr) {
      console.warn('Could not dispatch employee notification:', notifErr);
    }

    const newEmp = await db.collection('employees').findOne({ organizationId: orgId, employeeId });

    return NextResponse.json({
      success: true,
      message: `Employee ${firstName} ${lastName} created successfully with ID ${employeeId}.`,
      data: newEmp,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create employee' }, { status: 500 });
  }
}
