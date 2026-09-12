import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { searchParams } = new URL(req.url);
    const requestedEmpId = searchParams.get('employeeId');

    const targetEmpId = auth.role === 'EMPLOYEE' ? (auth.employeeId || requestedEmpId) : (requestedEmpId || auth.employeeId);

    if (!targetEmpId) {
      return NextResponse.json({ success: false, message: 'Employee ID is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const currentYear = new Date().getFullYear();

    let balanceDoc: any = await db.collection('leave_balances').findOne({
      organizationId: orgId,
      employeeId: targetEmpId,
      year: currentYear,
    });

    // Fetch configured active leave types
    const activeTypes = await db
      .collection('leave_types')
      .find({ organizationId: orgId, active: true })
      .toArray();

    const leaveTypeConfigs = activeTypes.length > 0
      ? activeTypes
      : [
          { name: 'Casual Leave', code: 'CL', allowanceDays: 12, isPaid: true },
          { name: 'Sick Leave', code: 'SL', allowanceDays: 10, isPaid: true },
          { name: 'Earned Leave', code: 'EL', allowanceDays: 15, isPaid: true },
          { name: 'Unpaid Leave / LOP', code: 'LOP', allowanceDays: 30, isPaid: false },
        ];

    if (!balanceDoc) {
      const now = new Date();
      const defaultBalances: any = {};

      for (const lt of leaveTypeConfigs) {
        const key = lt.name || lt.code;
        const total = lt.allowanceDays || 12;
        defaultBalances[key] = {
          code: lt.code,
          name: lt.name,
          total,
          used: 0,
          pending: 0,
          remaining: total,
          isPaid: lt.isPaid ?? true,
        };
      }

      const newBal = {
        organizationId: orgId,
        employeeId: targetEmpId,
        year: currentYear,
        balances: defaultBalances,
        createdAt: now,
        updatedAt: now,
      };

      await db.collection('leave_balances').insertOne(newBal as any);
      balanceDoc = newBal;
    } else {
      // Synchronize missing leave types if new types were added to company policy
      let updated = false;
      const balances = balanceDoc.balances || {};

      for (const lt of leaveTypeConfigs) {
        const key = lt.name || lt.code;
        if (!balances[key]) {
          const total = lt.allowanceDays || 12;
          balances[key] = {
            code: lt.code,
            name: lt.name,
            total,
            used: 0,
            pending: 0,
            remaining: total,
            isPaid: lt.isPaid ?? true,
          };
          updated = true;
        }
      }

      if (updated) {
        await db.collection('leave_balances').updateOne(
          { _id: balanceDoc._id },
          { $set: { balances, updatedAt: new Date() } }
        );
        balanceDoc.balances = balances;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        employeeId: targetEmpId,
        year: currentYear,
        balances: balanceDoc.balances || {},
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch leave balances' }, { status: 500 });
  }
}
