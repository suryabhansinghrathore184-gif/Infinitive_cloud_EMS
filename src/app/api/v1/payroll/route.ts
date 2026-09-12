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

    // Filter by employee if EMPLOYEE or MANAGER
    const recordQuery: any = { organizationId: orgId };
    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      recordQuery.employeeId = auth.employeeId;
    }

    const [payrollRecords, salaryStructures, salaryRules, salaryAssignments, settingsDoc] = await Promise.all([
      db.collection('payroll_records').find(recordQuery).sort({ payYear: -1, payMonth: -1 }).toArray(),
      db.collection('salary_structures').find({ organizationId: orgId }).toArray(),
      db.collection('salary_rules').find({ organizationId: orgId }).toArray(),
      db.collection('salary_assignments').find({ organizationId: orgId }).toArray(),
      db.collection('payroll_settings').findOne({ organizationId: orgId }),
    ]);

    // Calculate live summary metrics directly from database records
    const totalNetDisbursed = payrollRecords.reduce((acc, r) => acc + (r.netSalary || 0), 0);
    const totalStatutoryDeductions = payrollRecords.reduce(
      (acc, r) => acc + (r.pf || 0) + (r.pt || 0) + (r.tds || 0) + (r.esi || 0),
      0
    );
    const payslipsCount = payrollRecords.filter(
      (r) => r.status === 'APPROVED' || r.status === 'PAID'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        payrollRecords,
        salaryStructures,
        salaryRules,
        salaryAssignments,
        payrollSettings: settingsDoc || {
          workingDaysPerMonth: 26,
          overtimeRatePerHour: 250,
          pfDefaultPercent: 12,
          ptDefaultAmount: 200,
          tdsDefaultPercent: 10,
          esiDefaultPercent: 0.75,
        },
        metrics: {
          totalNetDisbursed,
          totalStatutoryDeductions,
          payslipsCount,
          totalRecords: payrollRecords.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch payroll records' },
      { status: 500 }
    );
  }
}

// POST /api/v1/payroll - Process Payroll Engine (Idempotent Batch Processing)
export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { month, year, employeeIds } = body;

    if (!month || !year) {
      return NextResponse.json(
        { success: false, message: 'Pay month and pay year are required.' },
        { status: 400 }
      );
    }

    const payMonth = Number(month);
    const payYear = Number(year);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[payMonth - 1] || 'Unknown';
    const payrollPeriod = `${payYear}-${String(payMonth).padStart(2, '0')}`;
    const payPeriod = `${monthName} ${payYear}`;

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    // 1. Fetch active employees
    let empQuery: any = { organizationId: orgId, status: { $nin: ['Terminated', 'Former Employee'] } };
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      empQuery.employeeId = { $in: employeeIds };
    }
    const employees = await db.collection('employees').find(empQuery).toArray();

    if (!employees || employees.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No eligible active employees found for payroll processing.' },
        { status: 400 }
      );
    }

    // 2. Fetch active statutory rules dynamically from MongoDB
    const activeRules = await db.collection('salary_rules').find({ organizationId: orgId, enabled: true }).toArray();

    const pfRule = activeRules.find((r) => r.code === 'DED_PF' || r.name.toLowerCase().includes('provident fund'));
    const ptRule = activeRules.find((r) => r.code === 'DED_PT' || r.name.toLowerCase().includes('professional tax'));
    const tdsRule = activeRules.find((r) => r.code === 'DED_TDS' || r.name.toLowerCase().includes('tax'));
    const esiRule = activeRules.find((r) => r.code === 'DED_ESI' || r.name.toLowerCase().includes('esi'));

    const pfPercent = pfRule ? Number(pfRule.value) : 12;
    const ptAmount = ptRule ? Number(ptRule.value) : 200;
    const tdsPercent = tdsRule ? Number(tdsRule.value) : 10;
    const esiPercent = esiRule ? Number(esiRule.value) : 0.75;

    // 3. Fetch payroll settings
    const settings = await db.collection('payroll_settings').findOne({ organizationId: orgId });
    const workingDays = settings?.workingDaysPerMonth || 26;
    const overtimeRateDefault = settings?.overtimeRatePerHour || 250;

    // 4. Fetch salary assignments with effective date matching
    const assignments = await db.collection('salary_assignments').find({ organizationId: orgId }).toArray();
    const structures = await db.collection('salary_structures').find({ organizationId: orgId }).toArray();
    const defaultStructure = structures[0] || { basicSalary: 50000, hraValue: 20000, conveyance: 3000, medical: 2000, specialAllowance: 5000 };

    // Target date for pay period (e.g. 15th of the month)
    const targetPeriodDate = new Date(payYear, payMonth - 1, 15);

    // 5. Fetch leaves & attendance for calculation context
    const leaves = await db.collection('leaves').find({ organizationId: orgId, status: 'Approved' }).toArray();
    const attendanceRecords = await db.collection('attendance').find({ organizationId: orgId }).toArray();

    const bulkOperations: any[] = [];
    const processedRecordsSummary: any[] = [];

    const now = new Date();

    for (const emp of employees) {
      const empIdStr = emp.employeeId || emp._id.toString();

      // Find applicable salary assignment based on effectiveFrom / effectiveTo dates
      const empAssignments = assignments.filter((a) => a.employeeId === empIdStr || a.employeeId === emp._id.toString());
      const validAssignment = empAssignments.find((a) => {
        const fromOk = !a.effectiveFrom || new Date(a.effectiveFrom) <= targetPeriodDate;
        const toOk = !a.effectiveTo || new Date(a.effectiveTo) >= targetPeriodDate;
        return fromOk && toOk && a.status !== 'Superceded';
      }) || empAssignments[0];

      const basic = validAssignment?.basicSalary ?? defaultStructure.basicSalary ?? 50000;
      const hra = validAssignment?.hra ?? (defaultStructure.hraType === 'PercentBasic' ? Math.round(basic * (defaultStructure.hraValue / 100)) : defaultStructure.hraValue) ?? 20000;
      const conveyance = validAssignment?.conveyance ?? defaultStructure.conveyance ?? 3000;
      const medical = validAssignment?.medical ?? defaultStructure.medical ?? 2000;
      const specialAllowance = validAssignment?.specialAllowance ?? defaultStructure.specialAllowance ?? 5000;
      const otherAllowances = validAssignment?.otherAllowances ?? 0;
      const bonus = validAssignment?.bonus ?? 0;

      // Calculate attendance & leave LOP
      const empLeaves = leaves.filter((l) => l.employeeId === empIdStr || l.employeeId === emp._id.toString());
      let lopDays = 0;
      let leaveDays = 0;

      for (const leave of empLeaves) {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        if (start.getFullYear() === payYear && (start.getMonth() + 1) === payMonth) {
          const days = leave.durationDays || 1;
          leaveDays += days;
          const isLop = leave.leaveType?.toLowerCase().includes('unpaid') || leave.leaveType?.toLowerCase().includes('lop');
          if (isLop) lopDays += days;
        }
      }

      const paidDays = Math.max(0, workingDays - lopDays);
      const overtimeHours = 0;
      const overtimePay = overtimeHours * overtimeRateDefault;

      const grossSalary = basic + hra + conveyance + medical + specialAllowance + otherAllowances + overtimePay + bonus;

      // Dynamic deductions using active salary_rules
      const lopDeduction = lopDays > 0 ? Math.round((basic / workingDays) * lopDays) : 0;
      const pf = pfPercent > 0 ? Math.round(basic * (pfPercent / 100)) : 0;
      const pt = ptAmount > 0 ? ptAmount : 0;
      const tds = tdsPercent > 0 ? Math.round(grossSalary * (tdsPercent / 100)) : 0;
      const esi = esiPercent > 0 ? Math.round(grossSalary * (esiPercent / 100)) : 0;
      const otherDeductions = 0;

      const totalDeductions = lopDeduction + pf + pt + tds + esi + otherDeductions;
      const netSalary = Math.max(0, grossSalary - totalDeductions);

      const recordDoc = {
        organizationId: orgId,
        employeeId: empIdStr,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        avatar: emp.avatar || '',
        department: emp.department || 'General',
        designation: emp.designation || 'Staff',
        joiningDate: emp.joiningDate || '',
        payPeriod,
        payMonth,
        payYear,
        payrollPeriod,
        workingDays,
        paidDays,
        leaveDays,
        lopDays,
        overtimeHours,
        overtimePay,
        bonus,
        basic,
        allowances: {
          hra,
          conveyance,
          medical,
          specialAllowance,
          otherAllowances,
        },
        grossSalary,
        pf,
        pt,
        tds,
        esi,
        otherDeductions,
        totalDeductions,
        netSalary,
        status: 'PROCESSED',
        processedBy: auth.email || auth.userId,
        processedAt: now,
        updatedAt: now,
      };

      processedRecordsSummary.push(recordDoc);

      bulkOperations.push({
        updateOne: {
          filter: { organizationId: orgId, employeeId: empIdStr, payrollPeriod },
          update: {
            $set: recordDoc,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      });
    }

    if (bulkOperations.length > 0) {
      await db.collection('payroll_records').bulkWrite(bulkOperations);
    }

    await logAuditEvent(req, 'PROCESS_PAYROLL', {
      details: { payPeriod, count: bulkOperations.length, month: payMonth, year: payYear },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed payroll for ${bulkOperations.length} employee(s) for period ${payPeriod}.`,
      count: bulkOperations.length,
      data: processedRecordsSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Payroll processing failed.' },
      { status: 500 }
    );
  }
}
