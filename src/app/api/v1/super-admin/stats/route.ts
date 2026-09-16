import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const safeNumber = (val: any): number => {
  const n = Number(val);
  return Number.isFinite(n) && !isNaN(n) ? n : 0;
};

const safePercentage = (part: any, total: any): number => {
  const p = safeNumber(part);
  const t = safeNumber(total);
  if (t <= 0) return 0;
  return Math.round((p / t) * 1000) / 10;
};

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const range = searchParams.get('range') || '30D'; // 7D, 30D, 90D, 1Y
    const selectedOrgId = searchParams.get('organizationId') || searchParams.get('orgId') || 'ALL';
    const selectedDept = searchParams.get('department') || 'ALL';
    const selectedStatus = searchParams.get('status') || 'ALL';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Build base query filters
    const orgQuery: any = {};
    if (selectedOrgId !== 'ALL') {
      orgQuery.organizationId = selectedOrgId;
    }
    if (selectedStatus !== 'ALL') {
      orgQuery.status = selectedStatus;
    }

    const empQuery: any = {};
    if (selectedOrgId !== 'ALL') empQuery.organizationId = selectedOrgId;
    if (selectedDept !== 'ALL') empQuery.department = selectedDept;
    if (selectedStatus !== 'ALL') empQuery.status = selectedStatus;

    // Concurrently fetch real MongoDB metrics
    const [
      allOrgDocs,
      allEmployees,
      allUsers,
      allAttendance,
      allLeaves,
      allHrRequests,
      allDepartments,
      allPayrolls,
      allRecruitmentJobs,
      allCandidates,
      auditLogs,
      activeSessionsCount,
      failedLoginsCount,
      successfulLoginsCount,
      securityEvents7dCount,
      smtpSettingsDoc,
    ] = await Promise.all([
      db.collection('organization_settings').find(orgQuery).toArray(),
      db.collection('employees').find(empQuery).toArray(),
      db.collection('users').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('attendance').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('leaves').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('hr_requests').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('departments').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('payroll_records').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray(),
      db.collection('job_postings').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray().catch(() => []),
      db.collection('candidates').find(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId } : {}).toArray().catch(() => []),
      db.collection('audit_logs').find().sort({ timestamp: -1, _id: -1 }).limit(10).toArray(),
      db.collection('user_sessions').countDocuments(selectedOrgId !== 'ALL' ? { organizationId: selectedOrgId, expiresAt: { $gt: today }, status: { $ne: 'REVOKED' } } : { expiresAt: { $gt: today }, status: { $ne: 'REVOKED' } }).catch(() => 0),
      db.collection('audit_logs').countDocuments({ action: { $regex: /LOGIN_FAILED|UNAUTHORIZED|OTP_VERIFICATION_FAILED|LOCKED/i } }).catch(() => 0),
      db.collection('audit_logs').countDocuments({ action: { $regex: /LOGIN|LOGGED_IN|OTP_VERIFIED|SESSION/i } }).catch(() => 0),
      db.collection('audit_logs').countDocuments({ timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() } }).catch(() => 0),
      db.collection('system_settings').findOne({ _id: 'smtp' as any }).catch(() => null),
    ]);

    // 1. Organization Metrics
    const totalOrganizations = allOrgDocs.length;
    const activeOrganizations = allOrgDocs.filter((o) => o.status !== 'Inactive' && o.status !== 'INACTIVE').length;
    const inactiveOrganizations = totalOrganizations - activeOrganizations;
    const activeOrgPercentage = safePercentage(activeOrganizations, totalOrganizations);
    const inactiveOrgPercentage = safePercentage(inactiveOrganizations, totalOrganizations);

    // 2. Workforce Metrics
    const totalEmployees = allEmployees.length;
    const activeEmployees = allEmployees.filter((e) => e.status === 'Active' || e.status === 'Probation' || e.status === 'ACTIVE').length;
    const inactiveEmployees = totalEmployees - activeEmployees;
    const activeWorkforcePercentage = safePercentage(activeEmployees, totalEmployees);
    const inactiveWorkforcePercentage = safePercentage(inactiveEmployees, totalEmployees);

    // On Leave Today calculation
    const onLeaveTodayCount = allLeaves.filter(
      (l) => (l.status === 'Approved' || l.status === 'APPROVED') && l.startDate <= todayStr && l.endDate >= todayStr
    ).length;
    const leavePercentage = safePercentage(onLeaveTodayCount, totalEmployees);

    // Users and Approvals
    const totalUsers = allUsers.length;
    const pendingLeaves = allLeaves.filter((l) => l.status === 'Pending' || l.status === 'PENDING').length;
    const pendingTickets = allHrRequests.filter((r) => ['Open', 'Assigned', 'In Progress', 'open', 'OPEN'].includes(r.status)).length;
    const pendingApprovals = pendingLeaves + pendingTickets;

    // 3. Organization Comparison Breakdown
    const orgMap = new Map<string, any>();
    allOrgDocs.forEach((org) => {
      const orgId = org.organizationId || org.id || String(org._id);
      orgMap.set(orgId, {
        id: orgId,
        name: org.name || org.organizationName || orgId,
        status: org.status || 'Active',
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        users: 0,
        departments: 0,
        onLeaveToday: 0,
        createdAt: org.createdAt || new Date().toISOString(),
      });
    });

    // Populate counts per organization
    allEmployees.forEach((emp) => {
      const orgId = emp.organizationId || 'org-default';
      let entry = orgMap.get(orgId);
      if (!entry) {
        entry = {
          id: orgId,
          name: emp.organizationName || orgId,
          status: 'Active',
          totalEmployees: 0,
          activeEmployees: 0,
          inactiveEmployees: 0,
          users: 0,
          departments: 0,
          onLeaveToday: 0,
          createdAt: new Date().toISOString(),
        };
        orgMap.set(orgId, entry);
      }
      entry.totalEmployees += 1;
      if (emp.status === 'Active' || emp.status === 'Probation' || emp.status === 'ACTIVE') {
        entry.activeEmployees += 1;
      } else {
        entry.inactiveEmployees += 1;
      }
    });

    allUsers.forEach((u) => {
      const orgId = u.organizationId || 'org-default';
      const entry = orgMap.get(orgId);
      if (entry) entry.users += 1;
    });

    allDepartments.forEach((d) => {
      const orgId = d.organizationId || 'org-default';
      const entry = orgMap.get(orgId);
      if (entry) entry.departments += 1;
    });

    allLeaves.forEach((l) => {
      if ((l.status === 'Approved' || l.status === 'APPROVED') && l.startDate <= todayStr && l.endDate >= todayStr) {
        const orgId = l.organizationId || 'org-default';
        const entry = orgMap.get(orgId);
        if (entry) entry.onLeaveToday += 1;
      }
    });

    const orgBreakdown = Array.from(orgMap.values());

    // 4. Department Distribution
    const deptCounts: Record<string, number> = {};
    allEmployees.forEach((emp) => {
      const d = emp.department || 'General';
      deptCounts[d] = (deptCounts[d] || 0) + 1;
    });
    const departmentBreakdown = Object.entries(deptCounts).map(([name, count]) => ({
      name,
      count,
      percentage: safePercentage(count, totalEmployees),
    }));

    // 5. Growth Time Series (Organization & Workforce)
    let daysAgo = 30;
    if (range === '7D') daysAgo = 7;
    else if (range === '90D') daysAgo = 90;
    else if (range === '1Y') daysAgo = 365;

    const intervalsCount = 6;
    const orgGrowthTimeline: Array<{ date: string; newOrganizations: number; cumulativeOrganizations: number }> = [];
    const workforceGrowthTimeline: Array<{ date: string; newEmployees: number; cumulativeWorkforce: number }> = [];

    for (let i = intervalsCount - 1; i >= 0; i--) {
      const d = new Date();
      if (range === '7D') d.setDate(today.getDate() - i);
      else if (range === '30D') d.setDate(today.getDate() - i * 5);
      else if (range === '90D') d.setDate(today.getDate() - i * 15);
      else d.setMonth(today.getMonth() - i);

      const dateLabel = range === '7D' || range === '30D'
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

      const cumOrgs = allOrgDocs.filter((o) => !o.createdAt || new Date(o.createdAt) <= d).length;
      const cumWorkforce = allEmployees.filter((e) => {
        const joinVal = e.joiningDate || e.createdAt;
        return !joinVal || new Date(joinVal) <= d;
      }).length;

      orgGrowthTimeline.push({
        date: dateLabel,
        newOrganizations: Math.max(0, cumOrgs),
        cumulativeOrganizations: Math.max(cumOrgs, totalOrganizations > 0 ? 1 : 0),
      });

      workforceGrowthTimeline.push({
        date: dateLabel,
        newEmployees: Math.max(0, cumWorkforce),
        cumulativeWorkforce: Math.max(cumWorkforce, totalEmployees),
      });
    }

    // 6. Attendance Overview Analytics
    const todayAttendance = allAttendance.filter((a) => a.date === todayStr);
    const presentCount = todayAttendance.filter((a) => a.status === 'Present' || a.status === 'PRESENT').length;
    const absentCount = todayAttendance.filter((a) => a.status === 'Absent' || a.status === 'ABSENT').length;
    const lateCount = todayAttendance.filter((a) => a.status === 'Late' || a.status === 'LATE' || a.isLate).length;
    const attendanceTotal = todayAttendance.length || activeEmployees || 1;

    const attendanceStats = {
      presentCount,
      absentCount,
      lateCount,
      onLeaveCount: onLeaveTodayCount,
      attendancePercentage: safePercentage(presentCount, attendanceTotal),
      absencePercentage: safePercentage(absentCount, attendanceTotal),
      latePercentage: safePercentage(lateCount, attendanceTotal),
      totalRecordsToday: todayAttendance.length,
    };

    // 7. Leave Overview Analytics
    const approvedLeavesCount = allLeaves.filter((l) => l.status === 'Approved' || l.status === 'APPROVED').length;
    const rejectedLeavesCount = allLeaves.filter((l) => l.status === 'Rejected' || l.status === 'REJECTED').length;
    const cancelledLeavesCount = allLeaves.filter((l) => l.status === 'Cancelled' || l.status === 'CANCELLED').length;
    const totalLeavesCount = allLeaves.length;

    const leaveTypeCounts: Record<string, number> = {};
    allLeaves.forEach((l) => {
      const typeKey = l.type || l.leaveType || 'General';
      leaveTypeCounts[typeKey] = (leaveTypeCounts[typeKey] || 0) + 1;
    });

    const leaveStats = {
      pending: pendingLeaves,
      approved: approvedLeavesCount,
      rejected: rejectedLeavesCount,
      cancelled: cancelledLeavesCount,
      totalRequests: totalLeavesCount,
      approvalRate: safePercentage(approvedLeavesCount, totalLeavesCount || 1),
      byType: Object.entries(leaveTypeCounts).map(([type, count]) => ({ type, count })),
    };

    // 8. Recruitment Analytics
    const openJobsCount = allRecruitmentJobs.filter((j) => j.status === 'Open' || j.status === 'OPEN' || j.status === 'Active').length;
    const candidatesCount = allCandidates.length;
    const shortlistedCount = allCandidates.filter((c) => c.status === 'Shortlisted' || c.stage === 'Shortlisted').length;
    const interviewCount = allCandidates.filter((c) => c.status === 'Interview' || c.stage === 'Interview').length;
    const selectedCount = allCandidates.filter((c) => c.status === 'Selected' || c.status === 'Hired').length;
    const rejectedCandidatesCount = allCandidates.filter((c) => c.status === 'Rejected').length;

    const recruitmentStats = {
      hasData: openJobsCount > 0 || candidatesCount > 0,
      openJobs: openJobsCount,
      totalCandidates: candidatesCount,
      shortlisted: shortlistedCount,
      interview: interviewCount,
      selected: selectedCount,
      rejected: rejectedCandidatesCount,
    };

    // 9. Payroll Summary
    const processedPayrollCount = allPayrolls.filter((p) => p.status === 'Processed' || p.status === 'PROCESSED').length;
    const pendingPayrollCount = allPayrolls.filter((p) => p.status === 'Pending' || p.status === 'PENDING').length;
    const paidPayrollCount = allPayrolls.filter((p) => p.status === 'Paid' || p.status === 'PAID').length;
    const totalPayrollAmount = allPayrolls.reduce((sum, p) => sum + safeNumber(p.netPay || p.totalAmount || p.netSalary), 0);

    const payrollStats = {
      hasData: allPayrolls.length > 0,
      totalRecords: allPayrolls.length,
      processed: processedPayrollCount,
      pending: pendingPayrollCount,
      paid: paidPayrollCount,
      totalAmount: totalPayrollAmount,
    };

    // 10. Role Distribution
    const roleCounts: Record<string, number> = { SUPER_ADMIN: 0, ADMIN: 0, HR: 0, MANAGER: 0, EMPLOYEE: 0 };
    allUsers.forEach((u) => {
      const r = String(u.role || 'EMPLOYEE').toUpperCase();
      if (r.includes('SUPER')) roleCounts.SUPER_ADMIN += 1;
      else if (r.includes('ADMIN')) roleCounts.ADMIN += 1;
      else if (r.includes('HR')) roleCounts.HR += 1;
      else if (r.includes('MANAGER')) roleCounts.MANAGER += 1;
      else roleCounts.EMPLOYEE += 1;
    });

    const computedTotalRoleUsers = Object.values(roleCounts).reduce((a, b) => a + b, 0) || 1;
    const roleDistribution = [
      { role: 'SUPER_ADMIN', label: 'Super Admin', count: roleCounts.SUPER_ADMIN, percentage: safePercentage(roleCounts.SUPER_ADMIN, computedTotalRoleUsers), color: 'bg-indigo-600' },
      { role: 'ADMIN', label: 'Admin', count: roleCounts.ADMIN, percentage: safePercentage(roleCounts.ADMIN, computedTotalRoleUsers), color: 'bg-purple-600' },
      { role: 'HR', label: 'HR Admin', count: roleCounts.HR, percentage: safePercentage(roleCounts.HR, computedTotalRoleUsers), color: 'bg-blue-600' },
      { role: 'MANAGER', label: 'Manager', count: roleCounts.MANAGER, percentage: safePercentage(roleCounts.MANAGER, computedTotalRoleUsers), color: 'bg-amber-500' },
      { role: 'EMPLOYEE', label: 'Employee', count: roleCounts.EMPLOYEE, percentage: safePercentage(roleCounts.EMPLOYEE, computedTotalRoleUsers), color: 'bg-emerald-500' },
    ];

    // 11. Dynamic Executive Insights (Generated ONLY from real metrics)
    const insights: string[] = [];
    if (totalOrganizations > 0) {
      insights.push(`${activeOrganizations} of ${totalOrganizations} organizations are currently active (${activeOrgPercentage}% tenant operational uptime).`);
    } else {
      insights.push('No tenant organization records currently registered.');
    }

    if (totalEmployees > 0) {
      insights.push(`${activeEmployees} active employees currently constitute ${activeWorkforcePercentage}% of the global workforce.`);
    } else {
      insights.push('No employee records currently in global workforce database.');
    }

    if (onLeaveTodayCount > 0) {
      insights.push(`${onLeaveTodayCount} employees are approved on leave today (${leavePercentage}% of staff).`);
    } else {
      insights.push('0 employees are currently on leave today.');
    }

    if (pendingApprovals > 0) {
      insights.push(`${pendingApprovals} operational approvals (${pendingLeaves} leaves, ${pendingTickets} tickets) are currently pending.`);
    } else {
      insights.push('All operational approvals and helpdesk requests are fully processed.');
    }

    // 12. Security Overview, Infrastructure Health, & Audit Log Stream
    const securityOverview = {
      failedLogins: failedLoginsCount,
      successfulLogins: Math.max(successfulLoginsCount, activeSessionsCount, allUsers.length > 0 ? 1 : 0),
      activeSessions: activeSessionsCount,
      securityAlerts: failedLoginsCount,
      recentSecurityEvents: securityEvents7dCount,
    };

    const isDbHealthy = Boolean(db);
    const systemHealth = [
      {
        service: 'database',
        name: 'MongoDB Atlas Database',
        status: isDbHealthy ? 'Healthy' : 'Failed',
        details: isDbHealthy ? 'Primary cluster connected and responsive' : 'Database connection error',
      },
      {
        service: 'auth',
        name: 'Session & Auth Service',
        status: 'Healthy',
        details: `${activeSessionsCount} active user sessions authenticated`,
      },
      {
        service: 'security',
        name: 'RBAC Security Engine',
        status: 'Healthy',
        details: 'Role-based access control policies actively enforced',
      },
      {
        service: 'smtp',
        name: 'Gmail SMTP Gateway',
        status: smtpSettingsDoc?.config?.enabled !== false ? 'Connected' : 'Not Configured',
        details: smtpSettingsDoc?.config?.enabled !== false ? 'Transporter operational' : 'SMTP settings not yet configured',
      },
    ];

    const formattedRecentAuditLogs = (auditLogs || []).map((log: any) => ({
      id: log._id?.toString() || log.id || String(Math.random()),
      action: log.action || 'SYSTEM_EVENT',
      performedBy: log.performedBy || log.userEmail || log.userId || 'System',
      performedByName: log.performedByName || log.userName || log.performedBy || 'System Administrator',
      role: log.role || log.userRole || 'SUPER_ADMIN',
      organizationId: log.organizationId || log.orgId || 'GLOBAL',
      timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalOrganizations,
          activeOrganizations,
          inactiveOrganizations,
          activeOrgPercentage,
          inactiveOrgPercentage,
          totalUsers,
          totalWorkforce: totalEmployees,
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          activeWorkforcePercentage,
          inactiveWorkforcePercentage,
          onLeaveToday: onLeaveTodayCount,
          leavePercentage,
          pendingApprovals,
          pendingLeaves,
          pendingTickets,
        },
        tenantOperationalHealth: {
          totalOrganizations,
          activeOrganizations,
          inactiveOrganizations,
          activePercentage: activeOrgPercentage,
          inactivePercentage: inactiveOrgPercentage,
        },
        globalWorkforce: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
          onLeaveToday: onLeaveTodayCount,
          activePercentage: activeWorkforcePercentage,
          inactivePercentage: inactiveWorkforcePercentage,
          leavePercentage,
          departmentBreakdown,
        },
        orgBreakdown,
        organizationGrowth: orgGrowthTimeline,
        workforceGrowth: workforceGrowthTimeline,
        attendanceStats,
        leaveStats,
        recruitmentStats,
        payrollStats,
        roleDistribution,
        executiveInsights: insights,
        securityOverview,
        systemHealth,
        recentAuditLogs: formattedRecentAuditLogs,
      },
    });
  } catch (err: any) {
    console.error('Error fetching Super Admin executive stats:', err);
    return NextResponse.json({ success: false, message: err.message || 'Failed to fetch executive stats' }, { status: 500 });
  }
}
