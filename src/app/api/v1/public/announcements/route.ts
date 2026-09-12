import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.toLowerCase().trim() || '';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);

    const now = new Date();
    const nowIso = now.toISOString();

    // STRICT PRIVACY FILTER:
    // Only return items explicitly marked "Public Website" AND "Published"
    const filter: any = {
      visibility: 'Public Website',
      status: 'Published',
      $and: [
        {
          $or: [
            { publishAt: { $exists: false } },
            { publishAt: { $eq: null } },
            { publishAt: { $lte: nowIso } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $eq: null } },
            { expiresAt: { $gte: nowIso } },
          ],
        },
      ],
    };

    if (category && category !== 'ALL' && category !== 'All') {
      filter.category = category;
    }

    let announcements = await db
      .collection('announcements')
      .find(filter)
      .sort({ publishAt: -1, createdAt: -1, _id: -1 })
      .toArray();

    if (q) {
      announcements = announcements.filter(
        (a: any) =>
          a.title?.toLowerCase().includes(q) ||
          a.shortDescription?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      );
    }

    const totalCount = announcements.length;
    const startIndex = (page - 1) * limit;
    const paginated = announcements.slice(startIndex, startIndex + limit);

    // Sanitize response object to prevent internal user or system data leakage
    const sanitizedData = paginated.map((a: any) => ({
      id: a.id || a._id.toString(),
      title: a.title,
      slug: a.slug || a.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      shortDescription: a.shortDescription || a.content?.slice(0, 160) + '...',
      content: a.content,
      category: a.category || 'General',
      priority: a.priority || 'Normal',
      imageUrl: a.imageUrl || a.fileUrl || null,
      date: a.date || a.publishAt?.split('T')[0] || a.createdAt?.split('T')[0] || nowIso.split('T')[0],
      publishAt: a.publishAt,
      expiresAt: a.expiresAt,
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
    console.error('Public Announcements API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve public announcements.' },
      { status: 500 }
    );
  }
}
