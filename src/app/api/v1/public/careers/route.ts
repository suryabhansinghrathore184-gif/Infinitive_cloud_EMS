import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const department = searchParams.get('department') || '';
    const location = searchParams.get('location') || '';
    const employmentType = searchParams.get('employmentType') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const todayStr = new Date().toISOString().split('T')[0];

    // STRICT PRIVACY FILTER FOR PUBLIC CAREERS:
    // Only return jobs where visibility = 'Public Website' AND status IN ['Published', 'Active']
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

    if (department && department !== 'ALL' && department !== 'All') {
      filter.department = department;
    }
    if (location && location !== 'ALL' && location !== 'All') {
      filter.location = location;
    }
    if (employmentType && employmentType !== 'ALL' && employmentType !== 'All') {
      filter.employmentType = employmentType;
    }

    let jobs = await db
      .collection('jobs')
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .toArray();

    if (q) {
      jobs = jobs.filter(
        (j: any) =>
          j.jobTitle?.toLowerCase().includes(q) ||
          j.department?.toLowerCase().includes(q) ||
          j.location?.toLowerCase().includes(q) ||
          j.description?.toLowerCase().includes(q) ||
          (Array.isArray(j.skills) && j.skills.some((s: string) => s.toLowerCase().includes(q)))
      );
    }

    const totalCount = jobs.length;
    const startIndex = (page - 1) * limit;
    const paginated = jobs.slice(startIndex, startIndex + limit);

    // Mapped sanitized public output
    const sanitizedData = paginated.map((j: any) => ({
      id: j.id || j._id.toString(),
      jobTitle: j.jobTitle,
      slug: j.slug || j.jobTitle?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      department: j.department || 'General',
      location: j.location || 'Headquarters',
      employmentType: j.employmentType || j.type || 'Full-time',
      experience: j.experience || 'Not specified',
      skills: Array.isArray(j.skills) ? j.skills : j.skills ? j.skills.split(',').map((s: string) => s.trim()) : [],
      openings: j.openings || 1,
      salary: j.showSalaryPublicly ? j.salary || 'Competitive' : undefined,
      showSalaryPublicly: j.showSalaryPublicly || false,
      shortDescription: j.description ? j.description.slice(0, 180) + '...' : '',
      description: j.description || '',
      responsibilities: j.responsibilities || '',
      requirements: j.requirements || '',
      benefits: j.benefits || '',
      applicationDeadline: j.applicationDeadline || null,
      postedDate: j.postedDate || j.createdAt?.split('T')[0] || todayStr,
    }));

    return NextResponse.json({
      success: true,
      data: sanitizedData,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Public Careers API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve public career openings.' },
      { status: 500 }
    );
  }
}
