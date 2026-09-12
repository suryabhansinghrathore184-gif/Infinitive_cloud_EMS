import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b', '#3b82f6'];

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    // Role check: Only HR, Admin, Super Admin, Manager can access reporting analytics
    if (auth.role === 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Forbidden. Employees cannot access executive reports.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const deptFilter = searchParams.get('department') || 'All';
    const locFilter = searchParams.get('location') || 'All';
    const statusFilter = searchParams.get('status') || 'All';
    const monthFilter = searchParams.get('month') || ''; // e.g. "2026-09"

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const empQuery: any = { organizationId: orgId };

    if (auth.role === 'MANAGER' && auth.employeeId) {
      empQuery.$or = [
        { managerId: auth.employeeId },
        { reportingTo: auth.employeeId },
        { employeeId: auth.employeeId },
      ];
    }

    if (deptFilter && deptFilter !== 'All') {
      empQuery.department = deptFilter;
    }
    if (locFilter && locFilter !== 'All') {
      empQuery.location = locFilter;
    }
    if (statusFilter && statusFilter !== 'All') {
      empQuery.status = statusFilter;
    }

    const employees = await db
      .collection('employees')
      .find(empQuery, {
        projection: {
          firstName: 1,
          lastName: 1,
          department: 1,
          location: 1,
          status: 1,
          joiningDate: 1,
          employmentType: 1,
          gender: 1,
          resignationDate: 1,
          terminationDate: 1,
        },
      })
      .toArray();
    const departments = await db.collection('departments').find({ organizationId: orgId }).toArray();
    const locations = await db.collection('locations').find({ organizationId: orgId }).toArray();

    // 1. Department Distribution & Headcount
    const deptMap: Record<string, number> = {};
    employees.forEach((emp) => {
      const d = emp.department || 'Unassigned';
      deptMap[d] = (deptMap[d] || 0) + 1;
    });

    const totalEmployees = employees.length;
    const deptNames = Array.from(new Set([...departments.map((d) => d.name), ...Object.keys(deptMap)]));

    const deptDistribution = deptNames
      .map((name, index) => {
        const count = deptMap[name] || 0;
        const percentage = totalEmployees > 0 ? Number(((count / totalEmployees) * 100).toFixed(1)) : 0;
        return {
          name,
          count,
          percentage,
          color: COLORS[index % COLORS.length],
        };
      })
      .filter((d) => d.count > 0 || departments.some((dept) => dept.name === d.name));

    // 2. Workforce Overview Metrics
    const activeEmployees = employees.filter((e) => e.status === 'Active' || e.status === 'Probation').length;

    const now = new Date();
    const currentYearMonth = monthFilter || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const newJoinersThisMonth = employees.filter((e) => {
      if (!e.joiningDate) return false;
      return e.joiningDate.startsWith(currentYearMonth);
    }).length;

    const exitsThisMonth = employees.filter((e) => {
      if (e.status !== 'Resigned' && e.status !== 'Terminated' && e.status !== 'Former Employee') return false;
      const dateStr = e.resignationDate || e.terminationDate || e.updatedAt || '';
      return dateStr.startsWith(currentYearMonth);
    }).length;

    // 3. Employment Type Distribution
    const typeMap: Record<string, number> = {};
    employees.forEach((e) => {
      const t = e.employmentType || 'Full-time';
      typeMap[t] = (typeMap[t] || 0) + 1;
    });
    const employmentTypeDistribution = Object.entries(typeMap).map(([name, count]) => ({ name, count }));

    // 4. Location Distribution
    const locMap: Record<string, number> = {};
    employees.forEach((e) => {
      const l = e.location || 'HQ Main Office';
      locMap[l] = (locMap[l] || 0) + 1;
    });
    const locationDistribution = Object.entries(locMap).map(([name, count]) => ({ name, count }));

    // 5. Gender Distribution (only if gender data exists)
    const genderMap: Record<string, number> = {};
    let hasGenderData = false;
    employees.forEach((e) => {
      if (e.gender) {
        hasGenderData = true;
        const g = e.gender.trim();
        genderMap[g] = (genderMap[g] || 0) + 1;
      }
    });
    const genderDistribution = hasGenderData
      ? Object.entries(genderMap).map(([name, count]) => ({ name, count }))
      : [];

    // 6. Monthly Headcount Trend (derived from real joining dates over last 6 months)
    const monthlyTrendMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      // Count employees joined on or before this month end and not exited before this month
      const countAtMonth = employees.filter((e) => {
        if (!e.joiningDate) return true;
        return e.joiningDate.slice(0, 7) <= ym;
      }).length;

      monthlyTrendMap[monthLabel] = countAtMonth;
    }
    const monthlyHeadcountTrend = Object.entries(monthlyTrendMap).map(([month, headcount]) => ({ month, headcount }));

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        newJoinersThisMonth,
        exitsThisMonth,
        deptDistribution,
        employmentTypeDistribution,
        locationDistribution,
        genderDistribution,
        monthlyHeadcountTrend,
      },
    });
  } catch (error: any) {
    console.error('Error in reports analytics route:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch report analytics' }, { status: 500 });
  }
}
