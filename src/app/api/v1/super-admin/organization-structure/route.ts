import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();

    // Concurrently fetch all relevant collections
    const [orgDocs, deptDocs, desigDocs, empDocs, userDocs] = await Promise.all([
      db.collection('organization_settings').find({}).toArray(),
      db.collection('departments').find({}).toArray(),
      db.collection('designations').find({}).toArray(),
      db.collection('employees').find({}).toArray(),
      db.collection('users').find({}).toArray(),
    ]);

    // 1. Map raw organization settings into clean Organization records
    const orgMap = new Map<string, any>();

    for (const doc of orgDocs) {
      const orgId = doc.organizationId || doc._id.toString();
      const orgDetails = doc.organization || {};

      // If org contains organization details or is primary settings doc
      if (orgDetails.name || doc.name || !orgMap.has(orgId)) {
        orgMap.set(orgId, {
          id: doc._id.toString(),
          organizationId: orgId,
          name: orgDetails.name || doc.name || 'Infinitive Cloud Solutions',
          legalName: orgDetails.legalName || orgDetails.name || 'Infinitive Cloud Solutions Pvt. Ltd.',
          code: orgDetails.code || doc.code || 'ICS-HQ',
          industry: orgDetails.industry || doc.industry || 'Information Technology',
          email: orgDetails.contactEmail || orgDetails.email || doc.email || 'contact@infinitivecloud.com',
          phone: orgDetails.contactPhone || orgDetails.phone || doc.phone || '+91 80000 12345',
          city: orgDetails.city || doc.city || 'Bangalore',
          state: orgDetails.state || doc.state || 'Karnataka',
          country: orgDetails.country || doc.country || 'India',
          status: doc.status || 'Active',
          logoUrl: orgDetails.logoUrl || doc.logoUrl || '',
          createdAt: doc.createdAt || new Date().toISOString(),
          updatedAt: doc.updatedAt || new Date().toISOString(),
        });
      }
    }

    // Ensure fallback org for 'org-default' if not present
    if (orgMap.size === 0 || (!orgMap.has('org-default') && empDocs.some((e) => e.organizationId === 'org-default'))) {
      orgMap.set('org-default', {
        id: 'org-default',
        organizationId: 'org-default',
        name: 'Infinitive Cloud Solutions',
        legalName: 'Infinitive Cloud Solutions Pvt. Ltd.',
        code: 'ICS-HQ',
        industry: 'Information Technology & Software',
        email: 'contact@infinitivecloud.com',
        phone: '+91 80000 12345',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        status: 'Active',
        logoUrl: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Also collect any organizationId referenced in employees that is missing from orgMap
    for (const emp of empDocs) {
      if (emp.organizationId && !orgMap.has(emp.organizationId)) {
        orgMap.set(emp.organizationId, {
          id: emp.organizationId,
          organizationId: emp.organizationId,
          name: emp.organizationId.replace(/^org-?/, '').toUpperCase() + ' Organization',
          code: emp.organizationId.toUpperCase().slice(0, 6),
          industry: 'Enterprise SaaS',
          email: 'admin@organization.com',
          phone: '+91 98765 43210',
          city: emp.location || 'Headquarters',
          state: 'State',
          country: 'India',
          status: 'Active',
          logoUrl: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    const organizationsList = Array.from(orgMap.values());

    // 2. Build multi-tenant hierarchy per organization
    const hierarchyTree = organizationsList.map((org) => {
      const orgId = org.organizationId;
      const orgEmployees = empDocs.filter((e) => e.organizationId === orgId || (!e.organizationId && orgId === 'org-default'));
      const orgUsers = userDocs.filter((u) => u.organizationId === orgId || (!u.organizationId && orgId === 'org-default'));

      // Explicit departments for this org
      const explicitDepts: any[] = deptDocs.filter((d) => d.organizationId === orgId || (!d.organizationId && orgId === 'org-default'));

      // Also collect departments referenced in employees that are not in explicitDepts
      const deptNamesSet = new Set<string>();
      explicitDepts.forEach((d) => deptNamesSet.add(d.name?.toLowerCase()));
      orgEmployees.forEach((e) => {
        if (e.department && !deptNamesSet.has(e.department.toLowerCase())) {
          deptNamesSet.add(e.department.toLowerCase());
          explicitDepts.push({
            id: `dept-dyn-${e.department.toLowerCase().replace(/\s+/g, '-')}`,
            name: e.department,
            code: e.department.substring(0, 4).toUpperCase(),
            organizationId: orgId,
            head: 'Unassigned',
            status: 'Active',
            description: 'Dynamically aggregated from workforce data',
          });
        }
      });

      // Build department nodes
      const departmentNodes = explicitDepts.map((dept) => {
        const deptName = dept.name;
        const deptEmployees = orgEmployees.filter(
          (e) => e.department?.toLowerCase() === deptName?.toLowerCase() || e.departmentId === dept.id
        );

        // Explicit designations for this department
        const explicitDesigs: any[] = desigDocs.filter(
          (des) =>
            des.departmentId === dept.id ||
            des.department?.toLowerCase() === deptName?.toLowerCase() ||
            (des.organizationId === orgId && des.department === deptName)
        );

        // Also collect designations referenced in employees that are not in explicitDesigs
        const desigTitlesSet = new Set<string>();
        explicitDesigs.forEach((des) => desigTitlesSet.add((des.title || des.name || des.designation)?.toLowerCase()));

        deptEmployees.forEach((e) => {
          if (e.designation && !desigTitlesSet.has(e.designation.toLowerCase())) {
            desigTitlesSet.add(e.designation.toLowerCase());
            explicitDesigs.push({
              id: `desg-dyn-${e.designation.toLowerCase().replace(/\s+/g, '-')}`,
              title: e.designation,
              code: e.designation.substring(0, 4).toUpperCase(),
              department: deptName,
              departmentId: dept.id,
              level: 'Standard',
              status: 'Active',
              organizationId: orgId,
            });
          }
        });

        // Build designation nodes
        const designationNodes = explicitDesigs.map((desig) => {
          const desigTitle = desig.title || desig.name || desig.designation;
          const desigEmployees = deptEmployees.filter(
            (e) =>
              e.designation?.toLowerCase() === desigTitle?.toLowerCase() ||
              e.designationId === desig.id
          );

          return {
            id: desig._id ? desig._id.toString() : desig.id,
            designationId: desig.id || (desig._id ? desig._id.toString() : `desg-${Date.now()}`),
            designation: desigTitle,
            title: desigTitle,
            code: desig.code || desigTitle?.substring(0, 3).toUpperCase() || 'DESG',
            level: desig.level || 'Standard',
            status: desig.status || 'Active',
            count: desigEmployees.length,
            employees: desigEmployees.map((e) => ({
              id: e._id.toString(),
              employeeId: e.employeeId || `EMP-${e._id.toString().slice(-4)}`,
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Staff Member',
              email: e.email || 'employee@organization.com',
              avatar: e.avatar || '',
              role: e.role || 'EMPLOYEE',
              status: e.status || e.employmentStatus || 'Active',
              department: e.department || deptName,
              designation: e.designation || desigTitle,
              location: e.location || 'Headquarters',
              joiningDate: e.joiningDate || '',
            })),
          };
        });

        // Collect employees in department who have no designation matched above
        const matchedEmpIds = new Set(designationNodes.flatMap((d) => d.employees.map((e) => e.id)));
        const unassignedDeptEmployees = deptEmployees
          .filter((e) => !matchedEmpIds.has(e._id.toString()))
          .map((e) => ({
            id: e._id.toString(),
            employeeId: e.employeeId || `EMP-${e._id.toString().slice(-4)}`,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Staff Member',
            email: e.email || 'employee@organization.com',
            avatar: e.avatar || '',
            role: e.role || 'EMPLOYEE',
            status: e.status || e.employmentStatus || 'Active',
            department: e.department || deptName,
            designation: e.designation || 'Unassigned',
            location: e.location || 'Headquarters',
            joiningDate: e.joiningDate || '',
          }));

        return {
          id: dept._id ? dept._id.toString() : dept.id,
          departmentId: dept.id || (dept._id ? dept._id.toString() : `dept-${Date.now()}`),
          department: deptName,
          name: deptName,
          code: dept.code || deptName?.substring(0, 3).toUpperCase() || 'DEPT',
          head: dept.head || 'Unassigned',
          status: dept.status || 'Active',
          count: deptEmployees.length,
          designations: designationNodes,
          unassignedStaff: unassignedDeptEmployees,
        };
      });

      return {
        id: org.id,
        organizationId: orgId,
        name: org.name,
        code: org.code,
        industry: org.industry,
        email: org.email,
        phone: org.phone,
        city: org.city,
        state: org.state,
        country: org.country,
        status: org.status,
        logoUrl: org.logoUrl,
        employeeCount: orgEmployees.length,
        departmentCount: departmentNodes.length,
        userCount: orgUsers.length,
        departments: departmentNodes,
      };
    });

    // 3. Compute Executive KPI Summaries
    const totalOrganizations = hierarchyTree.length;
    const allDepartmentsSet = new Set<string>();
    const allDesignationsSet = new Set<string>();

    hierarchyTree.forEach((org) => {
      org.departments.forEach((dept) => {
        allDepartmentsSet.add(dept.name.toLowerCase());
        dept.designations.forEach((des) => {
          allDesignationsSet.add(des.designation.toLowerCase());
        });
      });
    });

    const totalDepartments = allDepartmentsSet.size;
    const totalDesignations = allDesignationsSet.size;
    const totalEmployees = empDocs.length;
    const activeEmployees = empDocs.filter((e) => (e.status || e.employmentStatus || 'Active') === 'Active').length;

    // Unassigned employees: missing department OR designation
    const unassignedEmpList = empDocs
      .filter((e) => !e.department || !e.designation || e.department === 'Unassigned' || e.designation === 'Unassigned')
      .map((e) => ({
        id: e._id.toString(),
        employeeId: e.employeeId || `EMP-${e._id.toString().slice(-4)}`,
        name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Staff Member',
        email: e.email || '',
        organizationId: e.organizationId || 'org-default',
        department: e.department || 'Unassigned',
        designation: e.designation || 'Unassigned',
        status: e.status || e.employmentStatus || 'Active',
      }));

    const unassignedEmployees = unassignedEmpList.length;

    // 4. Structure Health Metrics
    const health = {
      deptsWithoutOrg: deptDocs.filter((d) => !d.organizationId).length,
      desigsWithoutDept: desigDocs.filter((d) => !d.department && !d.departmentId).length,
      empsWithoutDept: empDocs.filter((e) => !e.department || e.department === 'Unassigned').length,
      empsWithoutDesig: empDocs.filter((e) => !e.designation || e.designation === 'Unassigned').length,
      inactiveDepts: deptDocs.filter((d) => d.status === 'Inactive').length,
      inactiveDesigs: desigDocs.filter((d) => d.status === 'Inactive').length,
    };

    // 5. Filter Dropdown Lists
    const filterOptions = {
      organizations: organizationsList.map((o) => ({ id: o.organizationId, name: o.name, code: o.code })),
      departments: Array.from(allDepartmentsSet).map((dName) => ({
        name: dName.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      })),
    };

    // Log audit event
    await logAuditEvent(req, 'ORGANIZATION_VIEWED', {
      details: { message: 'Super Admin viewed organization structure hierarchy' },
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalOrganizations,
          totalDepartments,
          totalDesignations,
          totalEmployees,
          activeEmployees,
          unassignedEmployees,
        },
        health,
        organizations: hierarchyTree,
        unassignedEmployeesList: unassignedEmpList,
        filterOptions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching organization structure:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch organization structure' },
      { status: 500 }
    );
  }
}
