import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    if (!slug) {
      return NextResponse.json({ success: false, message: 'Slug is required.' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const todayStr = new Date().toISOString().split('T')[0];

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
        { success: false, message: 'Requirement not found or position is no longer accepting applications.' },
        { status: 404 }
      );
    }

    const sanitizedJob = {
      id: job.id || job._id.toString(),
      jobTitle: job.jobTitle,
      slug: job.slug || job.jobTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      department: job.department || 'General',
      location: job.location || 'Headquarters',
      employmentType: job.employmentType || job.type || 'Full-time',
      experience: job.experience || 'Not specified',
      skills: Array.isArray(job.skills) ? job.skills : job.skills ? job.skills.split(',').map((s: string) => s.trim()) : [],
      openings: job.openings || 1,
      salary: job.showSalaryPublicly ? job.salary || 'Competitive' : undefined,
      showSalaryPublicly: job.showSalaryPublicly || false,
      description: job.description || '',
      responsibilities: job.responsibilities || '',
      requirements: job.requirements || '',
      benefits: job.benefits || '',
      applicationDeadline: job.applicationDeadline || null,
      postedDate: job.postedDate || job.createdAt?.split('T')[0] || todayStr,
    };

    // Related openings in same department or general
    const related = allPublic
      .filter((j: any) => j._id.toString() !== job._id.toString())
      .slice(0, 3)
      .map((j: any) => ({
        id: j.id || j._id.toString(),
        jobTitle: j.jobTitle,
        slug: j.slug || j.jobTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        department: j.department,
        location: j.location,
        employmentType: j.employmentType || j.type,
      }));

    return NextResponse.json({
      success: true,
      data: {
        job: sanitizedJob,
        related,
      },
    });
  } catch (error: any) {
    console.error('Public Career Detail API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve career opportunity detail.' },
      { status: 500 }
    );
  }
}
