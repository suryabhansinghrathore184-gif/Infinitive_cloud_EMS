import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getFileStreamFromGridFS } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { id: leaveId, fileId } = params;
    if (!leaveId || !fileId) {
      return NextResponse.json({ success: false, message: 'Leave ID and File ID are required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    let query: any = { organizationId: orgId };
    if (ObjectId.isValid(leaveId)) {
      query.$or = [{ _id: new ObjectId(leaveId) }, { id: leaveId }];
    } else {
      query.id = leaveId;
    }

    const leaveDoc = await db.collection('leaves').findOne(query);
    if (!leaveDoc) {
      return NextResponse.json({ success: false, message: 'Leave request not found or access denied.' }, { status: 404 });
    }

    // Verify attachment fileId matches leave record
    if (leaveDoc.attachmentFileId !== fileId) {
      return NextResponse.json(
        { success: false, message: 'Attachment file does not belong to the specified leave request.' },
        { status: 403 }
      );
    }

    // RBAC Authorization check
    if (auth.role === 'EMPLOYEE' && leaveDoc.employeeId !== auth.employeeId) {
      return NextResponse.json({ success: false, message: 'Unauthorized to download this attachment.' }, { status: 403 });
    }

    if (auth.role === 'MANAGER' && auth.employeeId) {
      const isTeamMember = await db.collection('employees').findOne({
        organizationId: orgId,
        employeeId: leaveDoc.employeeId,
        $or: [{ managerId: auth.employeeId }, { reportingTo: auth.employeeId }, { employeeId: auth.employeeId }],
      });
      if (!isTeamMember) {
        return NextResponse.json({ success: false, message: 'Unauthorized to access team member attachment.' }, { status: 403 });
      }
    }

    const fileResult = await getFileStreamFromGridFS(fileId, 'documents');
    if (!fileResult) {
      return NextResponse.json({ success: false, message: 'Attachment file not found in storage.' }, { status: 404 });
    }

    return new NextResponse(fileResult.stream as any, {
      headers: {
        'Content-Type': fileResult.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(fileResult.filename || leaveDoc.attachmentName || 'document')}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to download attachment stream' },
      { status: 500 }
    );
  }
}
