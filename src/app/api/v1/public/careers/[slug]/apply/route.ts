import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, uploadFileToGridFS } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ success: false, message: 'Job identifier is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const todayStr = new Date().toISOString().split('T')[0];

    // Verify job is active & public
    const filter: any = {
      visibility: 'Public Website',
      status: { $in: ['Published', 'Active'] },
      $or: [
        { applicationDeadline: { $exists: false } },
        { applicationDeadline: { $eq: null } },
        { applicationDeadline: { $eq: '' } },
        { applicationDeadline: { $gte: todayStr } },
      ],
    };

    const allPublic = await db.collection('jobs').find(filter).toArray();
    const job = allPublic.find(
      (j: any) =>
        j.slug === slug ||
        j.id === slug ||
        j._id.toString() === slug ||
        j.jobTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
    );

    if (!job) {
      return NextResponse.json(
        { success: false, message: 'This requirement is no longer accepting public applications.' },
        { status: 404 }
      );
    }

    const contentType = req.headers.get('content-type') || '';
    let name = '';
    let email = '';
    let phone = '';
    let coverLetter = '';
    let linkedinUrl = '';
    let portfolioUrl = '';
    let resumeFileId = '';
    let resumeFileName = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      name = formData.get('name')?.toString() || '';
      email = formData.get('email')?.toString() || '';
      phone = formData.get('phone')?.toString() || '';
      coverLetter = formData.get('coverLetter')?.toString() || '';
      linkedinUrl = formData.get('linkedinUrl')?.toString() || '';
      portfolioUrl = formData.get('portfolioUrl')?.toString() || '';

      const resumeFile = formData.get('resume') as File | null;
      if (resumeFile && resumeFile.size > 0) {
        resumeFileName = resumeFile.name;
        const arrayBuffer = await resumeFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        resumeFileId = await uploadFileToGridFS(
          resumeFile.name,
          resumeFile.type || 'application/pdf',
          buffer,
          'documents'
        );
      }
    } else {
      const body = await req.json();
      name = body.name || '';
      email = body.email || '';
      phone = body.phone || '';
      coverLetter = body.coverLetter || '';
      linkedinUrl = body.linkedinUrl || '';
      portfolioUrl = body.portfolioUrl || '';
    }

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Full Name and Email Address are required.' },
        { status: 400 }
      );
    }

    const candidateId = `cand-${Date.now()}`;
    const now = new Date();

    const candidateRecord = {
      id: candidateId,
      organizationId: job.organizationId || 'default-org',
      jobId: job.id || job._id.toString(),
      jobTitle: job.jobTitle,
      name,
      email,
      phone,
      resumeFileId,
      resumeFileName,
      coverLetter,
      linkedinUrl,
      portfolioUrl,
      stage: 'Applied',
      appliedDate: todayStr,
      rating: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('candidates').insertOne(candidateRecord);

    // Update job openings candidates count
    await db.collection('jobs').updateOne(
      { _id: job._id },
      { $inc: { candidatesCount: 1 } }
    );

    return NextResponse.json({
      success: true,
      message: `Application submitted successfully for ${job.jobTitle}! Our HR team will review your resume.`,
      data: {
        applicationId: candidateId,
        appliedDate: todayStr,
      },
    });
  } catch (error: any) {
    console.error('Candidate Application Submission API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error submitting candidate application. Please try again.' },
      { status: 500 }
    );
  }
}
