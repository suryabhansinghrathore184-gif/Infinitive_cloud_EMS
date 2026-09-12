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
    const nowIso = new Date().toISOString();

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

    // Find by exact slug or matching ID/slug
    const allPublic = await db.collection('announcements').find(filter).toArray();
    
    const announcement = allPublic.find(
      (a: any) =>
        a.slug === slug ||
        a.id === slug ||
        a._id.toString() === slug ||
        a.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
    );

    if (!announcement) {
      return NextResponse.json(
        { success: false, message: 'Announcement not found or no longer publicly accessible.' },
        { status: 404 }
      );
    }

    // Related public announcements
    const related = allPublic
      .filter((a: any) => a._id.toString() !== announcement._id.toString())
      .slice(0, 3)
      .map((a: any) => ({
        id: a.id || a._id.toString(),
        title: a.title,
        slug: a.slug || a.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        shortDescription: a.shortDescription || a.content?.slice(0, 120) + '...',
        category: a.category,
        date: a.date || a.publishAt?.split('T')[0] || a.createdAt?.split('T')[0],
      }));

    const sanitizedData = {
      id: announcement.id || announcement._id.toString(),
      title: announcement.title,
      slug: announcement.slug || announcement.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      shortDescription: announcement.shortDescription || announcement.content?.slice(0, 160) + '...',
      content: announcement.content,
      category: announcement.category || 'General',
      priority: announcement.priority || 'Normal',
      imageUrl: announcement.imageUrl || announcement.fileUrl || null,
      fileId: announcement.fileId || null,
      date: announcement.date || announcement.publishAt?.split('T')[0] || announcement.createdAt?.split('T')[0],
      publishAt: announcement.publishAt,
      expiresAt: announcement.expiresAt,
    };

    return NextResponse.json({
      success: true,
      data: {
        announcement: sanitizedData,
        related,
      },
    });
  } catch (error: any) {
    console.error('Public Announcement Detail API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch public announcement detail.' },
      { status: 500 }
    );
  }
}
