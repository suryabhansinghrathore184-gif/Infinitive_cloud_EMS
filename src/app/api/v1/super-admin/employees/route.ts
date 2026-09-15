import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

function formatRoleTitle(role?: string): string {
  if (!role) return 'Role Not Assigned';
  const cleanRole = role.toUpperCase();
  switch (cleanRole) {
    case 'SUPER_ADMIN':
      return 'Super Admin';
    case 'ADMIN':
      return 'Admin';
    case 'HR':
      return 'HR';
    case 'MANAGER':
      return 'Manager';
    case 'EMPLOYEE':
      return 'Employee';
    default:
      return role;
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '15', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const orgFilter = searchParams.get('organizationId')?.trim() || 'All';
    const deptFilter = searchParams.get('department')?.trim() || 'All';
    const desigFilter = searchParams.get('designation')?.trim() || 'All';
    const roleFilter = searchParams.get('role')?.trim() || 'All';
    const statusFilter = searchParams.get('status')?.trim() || 'All';
    const empTypeFilter = searchParams.get('employmentType')?.trim() || 'All';
    const exportFormat = searchParams.get('export')?.trim() || '';

    // 1. Fetch All Organizations and build orgMap
    const orgDocs = await db.collection('organization_settings').find({}).toArray();
    const orgMap = new Map<string, { id: string; name: string; code: string }>();

    orgDocs.forEach((doc) => {
      const orgId = doc.organizationId || doc._id.toString();
      const details = doc.organization || {};
      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, {
          id: orgId,
          name: details.name || doc.name || 'Infinitive Cloud Solutions',
          code: details.code || doc.code || 'ICS-HQ',
        });
      }
    });

    if (!orgMap.has('org-default')) {
      orgMap.set('org-default', {
        id: 'org-default',
        name: 'Infinitive Cloud Solutions',
        code: 'ICS-HQ',
      });
    }

    const organizationsList = Array.from(orgMap.values());

    // 2. Fetch All Users to build maps for canonical user role linkage
    const allUsers = await db.collection('users').find({}, {
      projection: { password: 0, passwordHash: 0, salt: 0, otp: 0 }
    }).toArray();

    const userByEmailMap = new Map<string, any>();
    const userByEmpIdMap = new Map<string, any>();
    const userByUserIdMap = new Map<string, any>();

    allUsers.forEach((u) => {
      if (u.email) userByEmailMap.set(u.email.toLowerCase(), u);
      if (u.employeeId) userByEmpIdMap.set(u.employeeId, u);
      if (u.id) userByUserIdMap.set(u.id, u);
      if (u._id) userByUserIdMap.set(u._id.toString(), u);
    });

    // 3. Fetch All Employees to compute global KPIs & Health metrics
    const allEmployees = await db.collection('employees').find({}).toArray();

    // Distinct metadata for filters
    const distinctDeptsSet = new Set<string>();
    const distinctDesigsSet = new Set<string>();
    allEmployees.forEach((e) => {
      if (e.department && e.department !== 'Unassigned') distinctDeptsSet.add(e.department);
      if (e.designation && e.designation !== 'Unassigned') distinctDesigsSet.add(e.designation);
    });

    // Also include departments and designations from collection documents if available
    const deptDocs = await db.collection('departments').find({}).toArray();
    deptDocs.forEach((d) => {
      if (d.name) distinctDeptsSet.add(d.name);
    });
    const desigDocs = await db.collection('designations').find({}).toArray();
    desigDocs.forEach((d) => {
      if (d.title || d.name) distinctDesigsSet.add(d.title || d.name);
    });

    const departmentsList = Array.from(distinctDeptsSet).sort();
    const designationsList = Array.from(distinctDesigsSet).sort();

    // 4. Calculate KPI Statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let inactiveCount = 0;
    let newCount = 0;

    allEmployees.forEach((emp) => {
      const isAct = emp.status === 'Active' || emp.status === 'ACTIVE';
      if (isAct) {
        activeCount++;
      } else {
        inactiveCount++;
      }

      const joinDate = emp.joiningDate ? new Date(emp.joiningDate) : emp.createdAt ? new Date(emp.createdAt) : null;
      if (joinDate && joinDate >= thirtyDaysAgo) {
        newCount++;
      }
    });

    const totalEmployees = allEmployees.length;

    // 5. Compute Data Quality / Directory Health Metrics
    let employeesWithoutOrg = 0;
    let employeesWithoutDept = 0;
    let employeesWithoutDesig = 0;
    let employeesWithoutUserAccount = 0;
    let roleMappingIssuesCount = 0;

    allEmployees.forEach((emp) => {
      if (!emp.organizationId) employeesWithoutOrg++;
      if (!emp.department || emp.department === 'Unassigned') employeesWithoutDept++;
      if (!emp.designation || emp.designation === 'Unassigned') employeesWithoutDesig++;

      // User account matching check
      const user = (emp.email && userByEmailMap.get(emp.email.toLowerCase())) ||
        (emp.employeeId && userByEmpIdMap.get(emp.employeeId)) ||
        (emp.userId && userByUserIdMap.get(emp.userId));

      if (!user) {
        employeesWithoutUserAccount++;
        roleMappingIssuesCount++;
      } else {
        // Check for role mismatch
        const systemRole = user.role;
        if (!systemRole) {
          roleMappingIssuesCount++;
        } else if (emp.role && emp.role.toUpperCase() !== systemRole.toUpperCase()) {
          roleMappingIssuesCount++;
        }
      }
    });

    // Users without Employee Profile
    const empEmailSet = new Set(allEmployees.map(e => e.email?.toLowerCase()).filter(Boolean));
    const empIdSet = new Set(allEmployees.map(e => e.employeeId).filter(Boolean));
    let usersWithoutEmployeeProfile = 0;
    allUsers.forEach((u) => {
      const hasEmp = (u.email && empEmailSet.has(u.email.toLowerCase())) || (u.employeeId && empIdSet.has(u.employeeId));
      if (!hasEmp) usersWithoutEmployeeProfile++;
    });

    // 6. Build Filter Query for Paginated Output
    let query: any = {};

    if (orgFilter !== 'All') {
      query.organizationId = orgFilter;
    }
    if (deptFilter !== 'All') {
      query.department = deptFilter;
    }
    if (desigFilter !== 'All') {
      query.designation = desigFilter;
    }
    if (statusFilter !== 'All') {
      if (statusFilter === 'Active') {
        query.status = { $in: ['Active', 'ACTIVE'] };
      } else if (statusFilter === 'Inactive') {
        query.status = { $in: ['Inactive', 'INACTIVE', 'Terminated', 'Disabled'] };
      } else {
        query.status = statusFilter;
      }
    }
    if (empTypeFilter !== 'All') {
      query.employmentType = empTypeFilter;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { employeeId: regex },
        { email: regex },
        { phone: regex },
        { department: regex },
        { designation: regex },
        { organizationId: regex },
      ];
    }

    // Execute query for matching employees
    let filteredEmpDocs = await db.collection('employees').find(query).sort({ createdAt: -1, _id: -1 }).toArray();

    // Map and enrich each employee document with User Role and Org Info
    let formattedEmployees = filteredEmpDocs.map((emp) => {
      // Canonical User linkage: user.email -> user.employeeId -> user.id/userId
      const user = (emp.email && userByEmailMap.get(emp.email.toLowerCase())) ||
        (emp.employeeId && userByEmpIdMap.get(emp.employeeId)) ||
        (emp.userId && userByUserIdMap.get(emp.userId)) || null;

      // CRITICAL DATA CORRECTION: Derive System Role strictly from users.role
      const systemRoleKey = user?.role || null;
      const systemRoleTitle = formatRoleTitle(user?.role);

      // Identity Mapping Issue check
      let hasIdentityMappingIssue = false;
      let mappingIssueReason = '';

      if (!user) {
        hasIdentityMappingIssue = true;
        mappingIssueReason = 'No user authentication account found';
      } else if (!user.role) {
        hasIdentityMappingIssue = true;
        mappingIssueReason = 'User account has no role assigned';
      } else if (emp.role && emp.role.toUpperCase() !== user.role.toUpperCase()) {
        hasIdentityMappingIssue = true;
        mappingIssueReason = `Role Mismatch: User (${user.role}) vs Profile (${emp.role})`;
      }

      const orgId = emp.organizationId || 'org-default';
      const orgInfo = orgMap.get(orgId) || {
        id: orgId,
        name: orgId.replace(/^org-?/, '').toUpperCase() + ' Org',
        code: orgId.toUpperCase().slice(0, 6),
      };

      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || 'Employee Profile';

      return {
        id: emp._id.toString(),
        employeeId: emp.employeeId || 'EMP-000',
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        fullName,
        email: emp.email || 'N/A',
        phone: emp.phone || 'N/A',
        department: emp.department || 'Unassigned',
        designation: emp.designation || 'Unassigned',

        // Canonical System Role from users.role
        systemRole: systemRoleKey,
        systemRoleTitle,
        hasIdentityMappingIssue,
        mappingIssueReason,

        status: emp.status || 'Active',
        employmentType: emp.employmentType || 'Full Time',
        joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : 'N/A',
        location: emp.location || 'Headquarters',
        managerId: emp.managerId || '',

        // Organization Info
        organizationId: orgId,
        organizationName: orgInfo.name,
        organizationCode: orgInfo.code,

        // User Account Link
        userId: user?.id || user?._id?.toString() || null,
        userStatus: user?.status || 'NO_ACCOUNT',
        userLastLogin: user?.lastLogin || user?.updatedAt || 'Never',

        // Avatar & Dates
        avatar: emp.avatar || user?.avatar || '',
        createdAt: emp.createdAt ? new Date(emp.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: emp.updatedAt ? new Date(emp.updatedAt).toISOString() : new Date().toISOString(),
      };
    });

    // Apply role filter on the mapped systemRole if roleFilter is active
    if (roleFilter !== 'All') {
      formattedEmployees = formattedEmployees.filter((e) => {
        if (roleFilter === 'UNASSIGNED') {
          return !e.systemRole;
        }
        return e.systemRole?.toUpperCase() === roleFilter.toUpperCase();
      });
    }

    // Total filtered count after role filtering
    const totalFilteredCount = formattedEmployees.length;

    // Support CSV Export
    if (exportFormat === 'csv') {
      await logAuditEvent(req, 'EMPLOYEE_EXPORT_REQUESTED', {
        details: { totalExported: totalFilteredCount, search, orgFilter, deptFilter, roleFilter },
      });

      const csvHeaders = ['Employee ID', 'Full Name', 'Email', 'Organization Name', 'Organization Code', 'Department', 'Designation', 'System Role', 'Status', 'Employment Type', 'Joining Date'];
      const csvRows = formattedEmployees.map(e => [
        `"${e.employeeId}"`,
        `"${e.fullName}"`,
        `"${e.email}"`,
        `"${e.organizationName}"`,
        `"${e.organizationCode}"`,
        `"${e.department}"`,
        `"${e.designation}"`,
        `"${e.systemRoleTitle}"`,
        `"${e.status}"`,
        `"${e.employmentType}"`,
        `"${e.joiningDate}"`,
      ].join(','));

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="global_workforce_directory_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Apply server-side pagination slicing
    const paginatedEmployees = formattedEmployees.slice((page - 1) * limit, page * limit);

    // Audit Log view event
    await logAuditEvent(req, 'EMPLOYEE_VIEWED', {
      details: { page, limit, totalFilteredCount, search, orgFilter, deptFilter, roleFilter },
    });

    return NextResponse.json({
      success: true,
      data: {
        kpi: {
          totalEmployees,
          activeEmployees: activeCount,
          inactiveEmployees: inactiveCount,
          newEmployees: newCount,
          totalDepartments: departmentsList.length,
          totalOrganizations: organizationsList.length,
        },
        directoryHealth: {
          employeesWithoutOrg,
          employeesWithoutDept,
          employeesWithoutDesig,
          employeesWithoutUserAccount,
          usersWithoutEmployeeProfile,
          roleMappingIssues: roleMappingIssuesCount,
          isHealthy: roleMappingIssuesCount === 0 && employeesWithoutUserAccount === 0 && usersWithoutEmployeeProfile === 0,
        },
        filters: {
          organizations: organizationsList,
          departments: departmentsList,
          designations: designationsList,
          roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE', 'UNASSIGNED'],
          statuses: ['Active', 'Inactive', 'Pending', 'Suspended'],
          employmentTypes: ['Full Time', 'Part Time', 'Contract', 'Intern'],
        },
        employees: paginatedEmployees,
        pagination: {
          total: totalFilteredCount,
          page,
          limit,
          totalPages: Math.ceil(totalFilteredCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching global workforce directory:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch global workforce directory' }, { status: 500 });
  }
}

// PATCH /api/v1/super-admin/employees - Update employee profile (safe fields only)
export async function PATCH(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { id, firstName, lastName, email, phone, department, designation, organizationId, joiningDate, location, employmentType, status, managerId } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Employee document ID is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    const empObjId = new ObjectId(id);
    const existingEmp = await db.collection('employees').findOne({ _id: empObjId });

    if (!existingEmp) {
      return NextResponse.json({ success: false, message: 'Employee record not found.' }, { status: 404 });
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (firstName !== undefined) updateFields.firstName = firstName.trim();
    if (lastName !== undefined) updateFields.lastName = lastName.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (department !== undefined) updateFields.department = department.trim();
    if (designation !== undefined) updateFields.designation = designation.trim();
    if (organizationId !== undefined) updateFields.organizationId = organizationId.trim();
    if (joiningDate !== undefined) updateFields.joiningDate = joiningDate.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (employmentType !== undefined) updateFields.employmentType = employmentType.trim();
    if (status !== undefined) updateFields.status = status.trim();
    if (managerId !== undefined) updateFields.managerId = managerId.trim();

    await db.collection('employees').updateOne({ _id: empObjId }, { $set: updateFields });

    // Also update associated user document (name, department, designation, status) if user exists
    const userEmail = existingEmp.email?.toLowerCase();
    if (userEmail) {
      const userUpdateFields: any = { updatedAt: new Date() };
      if (firstName || lastName) {
        const fn = firstName || existingEmp.firstName || '';
        const ln = lastName || existingEmp.lastName || '';
        userUpdateFields.name = `${fn} ${ln}`.trim();
      }
      if (department) userUpdateFields.department = department;
      if (designation) userUpdateFields.designation = designation;
      if (status) {
        userUpdateFields.status = status === 'Active' ? 'ACTIVE' : 'INACTIVE';
      }
      await db.collection('users').updateOne({ email: userEmail }, { $set: userUpdateFields });
    }

    await logAuditEvent(req, 'EMPLOYEE_UPDATED', {
      employeeId: existingEmp.employeeId,
      oldValue: {
        firstName: existingEmp.firstName,
        lastName: existingEmp.lastName,
        department: existingEmp.department,
        designation: existingEmp.designation,
        status: existingEmp.status,
      },
      newValue: updateFields,
    });

    const updatedEmp = await db.collection('employees').findOne({ _id: empObjId });

    return NextResponse.json({
      success: true,
      message: 'Employee profile updated successfully.',
      data: updatedEmp,
    });
  } catch (error: any) {
    console.error('Error updating employee profile:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to update employee profile' }, { status: 500 });
  }
}
