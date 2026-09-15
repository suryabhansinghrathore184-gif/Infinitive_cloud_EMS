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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const department = searchParams.get('department')?.trim();
    const status = searchParams.get('status')?.trim();
    const orgFilter = searchParams.get('organizationId')?.trim();

    const { db } = await connectToDatabase();

    let filter: any = {};

    if (orgFilter && orgFilter !== 'All') {
      filter.organizationId = orgFilter;
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

    const employees = await db
      .collection('employees')
      .find(filter)
      .sort({ createdAt: -1, employeeId: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: {
        employees,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch workforce' }, { status: 500 });
  }
}
