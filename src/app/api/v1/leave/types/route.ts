import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_LEAVE_TYPES = [
  { name: 'Casual Leave', code: 'CL', allowanceDays: 12, isPaid: true, description: 'Short-term casual time off' },
  { name: 'Sick Leave', code: 'SL', allowanceDays: 10, isPaid: true, description: 'Medical or sick leave' },
  { name: 'Earned Leave', code: 'EL', allowanceDays: 15, isPaid: true, description: 'Privilege / earned vacation leave' },
  { name: 'Unpaid Leave / LOP', code: 'LOP', allowanceDays: 30, isPaid: false, description: 'Loss of pay leave' },
];

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let types = await db
      .collection('leave_types')
      .find({ organizationId: orgId })
      .sort({ createdAt: 1 })
      .toArray();

    // If no leave types exist yet, initialize from defaults
    if (types.length === 0) {
      const now = new Date();
      const initialDocs = DEFAULT_LEAVE_TYPES.map((t, idx) => ({
        id: `lt-${t.code.toLowerCase()}`,
        organizationId: orgId,
        name: t.name,
        code: t.code,
        allowanceDays: t.allowanceDays,
        isPaid: t.isPaid,
        description: t.description,
        active: true,
        order: idx + 1,
        createdAt: now,
        updatedAt: now,
      }));

      await db.collection('leave_types').insertMany(initialDocs as any);
      types = initialDocs as any;
    }

    return NextResponse.json({
      success: true,
      data: types,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch leave types' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { name, code, allowanceDays, isPaid, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, message: 'Leave type name is required.' }, { status: 400 });
    }

    const days = Number(allowanceDays);
    if (isNaN(days) || days < 0) {
      return NextResponse.json({ success: false, message: 'Allowance days must be a non-negative number.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const normalizedCode = (code || name.substring(0, 3)).trim().toUpperCase();

    // Check duplicate code or name
    const existing = await db.collection('leave_types').findOne({
      organizationId: orgId,
      $or: [
        { code: normalizedCode },
        { name: { $regex: `^${name.trim()}$`, $options: 'i' } },
      ],
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Leave type with name "${name}" or code "${normalizedCode}" already exists.` },
        { status: 400 }
      );
    }

    const newType = {
      id: `lt-${Date.now()}`,
      organizationId: orgId,
      name: name.trim(),
      code: normalizedCode,
      allowanceDays: days,
      isPaid: Boolean(isPaid),
      description: description?.trim() || '',
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const res = await db.collection('leave_types').insertOne(newType as any);

    await logAuditEvent(req, 'CREATE_LEAVE_TYPE', { details: newType });

    return NextResponse.json({
      success: true,
      message: `Leave type "${newType.name}" added successfully.`,
      data: { ...newType, _id: res.insertedId },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to create leave type' }, { status: 500 });
  }
}
