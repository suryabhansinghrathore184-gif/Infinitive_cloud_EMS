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

    let query: any = { organizationId: orgId };

    if (auth.role === 'EMPLOYEE' && auth.employeeId) {
      query.employeeId = auth.employeeId;
    } else if (auth.role === 'MANAGER' && auth.employeeId) {
      // Find team members
      const team = await db.collection('employees').find({
        organizationId: orgId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      }).toArray();
      const teamEmpIds = team.map((e) => e.employeeId || e._id.toString());
      query.employeeId = { $in: teamEmpIds };
    }

    const reviews = await db.collection('performance_reviews').find(query).sort({ reviewDate: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: reviews,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch performance reviews' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const body = await req.json();
    const { employeeId, employeeName, reviewPeriod, rating, feedback, goals } = body;

    if (!employeeId || rating === undefined) {
      return NextResponse.json({ success: false, message: 'Employee ID and rating are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;
    const now = new Date();

    const reviewDoc = {
      organizationId: orgId,
      employeeId,
      employeeName: employeeName || 'Employee',
      reviewer: auth.name || auth.email,
      reviewPeriod: reviewPeriod || 'Q1 2026',
      reviewDate: now.toISOString().split('T')[0],
      rating: Number(rating),
      feedback: feedback || '',
      goals: goals || [],
      status: 'Completed',
      updatedAt: now,
    };

    if (body.id) {
      await db.collection('performance_reviews').updateOne(
        { organizationId: orgId, id: body.id },
        { $set: reviewDoc, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
    } else {
      (reviewDoc as any).id = `rev-${Date.now()}`;
      (reviewDoc as any).createdAt = now;
      await db.collection('performance_reviews').insertOne(reviewDoc);
    }

    await logAuditEvent(req, 'SUBMIT_PERFORMANCE_REVIEW', { employeeId, details: reviewDoc });

    const updatedReviews = await db.collection('performance_reviews').find({ organizationId: orgId }).toArray();

    return NextResponse.json({
      success: true,
      message: 'Performance review submitted successfully.',
      data: updatedReviews,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Failed to save performance review' }, { status: 500 });
  }
}
