import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const [orgSetting, departments, designations, employees] = await Promise.all([
      db.collection('organization_settings').findOne({ organizationId: orgId }),
      db.collection('departments').find({ organizationId: orgId }).toArray(),
      db.collection('designations').find({ organizationId: orgId }).toArray(),
      db.collection('employees').find({ organizationId: orgId }).toArray(),
    ]);

    const companyName = orgSetting?.organization?.name || orgSetting?.name || 'Enterprise Organization';
    const companyCode = orgSetting?.organization?.code || 'ORG-001';

    // Group designations & employees by department
    const deptTree = departments.map((dept) => {
      const deptName = dept.name;
      const deptDesignations = designations.filter((des) => des.department === deptName || des.department === dept.id);
      const deptEmployees = employees.filter((emp) => emp.department === deptName || emp.department === dept.id);

      return {
        id: dept._id.toString(),
        name: deptName,
        code: dept.code || deptName.substring(0, 3).toUpperCase(),
        head: dept.head || 'Unassigned',
        employeeCount: deptEmployees.length,
        designations: deptDesignations.map((des) => ({
          id: des._id.toString(),
          title: des.title,
          code: des.code,
          level: des.level || 'L3',
          employees: deptEmployees
            .filter((e) => e.designation === des.title || e.designation === des.id)
            .map((e) => ({
              id: e._id.toString(),
              employeeId: e.employeeId,
              name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Staff',
              email: e.email,
              avatar: e.avatar || '',
              role: e.role || 'EMPLOYEE',
            })),
        })),
        unassignedStaff: deptEmployees
          .filter((e) => !deptDesignations.some((des) => des.title === e.designation || des.id === e.designation))
          .map((e) => ({
            id: e._id.toString(),
            employeeId: e.employeeId,
            name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || 'Staff',
            email: e.email,
            avatar: e.avatar || '',
            role: e.role || 'EMPLOYEE',
          })),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        company: {
          name: companyName,
          code: companyCode,
          totalEmployees: employees.length,
          totalDepartments: departments.length,
        },
        departments: deptTree,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch organization structure' }, { status: 500 });
  }
}
