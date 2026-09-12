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
    const rules = await db.collection('salary_rules').find({ organizationId: auth.organizationId }).toArray();

    return NextResponse.json({ success: true, data: rules });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch rules' }, { status: 500 });
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
    const { id, name, code, type, calculationType, value, appliesTo, effectiveFrom, enabled, description } = body;

    if (!name || !code || value === undefined) {
      return NextResponse.json({ success: false, message: 'Rule name, code, and value are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const ruleDoc = {
      organizationId: orgId,
      name,
      code,
      type: type || 'Deduction',
      calculationType: calculationType || 'Percentage of Basic',
      value: Number(value),
      appliesTo: appliesTo || 'All Employees',
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : now,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      description: description || '',
      updatedAt: now,
    };

    let result;
    if (id) {
      const existing = await db.collection('salary_rules').findOne({ organizationId: orgId, _id: id });
      await db.collection('salary_rules').updateOne(
        { organizationId: orgId, code },
        { $set: ruleDoc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      await logAuditEvent(req, 'UPDATE_SALARY_RULE', { details: ruleDoc, oldValue: existing || undefined });
    } else {
      await db.collection('salary_rules').updateOne(
        { organizationId: orgId, code },
        { $set: ruleDoc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      await logAuditEvent(req, 'CREATE_SALARY_RULE', { details: ruleDoc });
    }

    const updatedRules = await db.collection('salary_rules').find({ organizationId: orgId }).toArray();

    return NextResponse.json({
      success: true,
      message: `Salary rule "${name}" saved successfully.`,
      data: updatedRules,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to save salary rule' }, { status: 500 });
  }
}
