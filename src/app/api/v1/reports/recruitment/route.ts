import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { generateCSV, generateExcelXML } from '@/lib/exportHelper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth);
    if (!perm.isAllowed || auth.role === 'EMPLOYEE') {
      return NextResponse.json({ success: false, message: 'Forbidden. Access restricted.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const search = searchParams.get('search') || '';

    const { db } = await connectToDatabase();
    const orgId = auth.organizationId;

    const candQuery: any = { organizationId: orgId };
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      candQuery.$or = [{ name: searchRegex }, { fullName: searchRegex }, { email: searchRegex }, { jobTitle: searchRegex }];
    }

    const candidates = await db.collection('candidates').find(candQuery).toArray();
    const jobs = await db.collection('jobs').find({ organizationId: orgId }).toArray();

    const jobTitleMap: Record<string, string> = {};
    jobs.forEach((j) => {
      jobTitleMap[j.id || j._id.toString()] = j.title || j.role || 'Position';
    });

    const funnelCounts = {
      total: candidates.length,
      screening: 0,
      shortlisted: 0,
      interview: 0,
      selected: 0,
      offered: 0,
      hired: 0,
      rejected: 0,
    };

    let totalTimeToHireDays = 0;
    let hiredCountForTimeToHire = 0;

    candidates.forEach((c) => {
      const stage = (c.stage || c.status || 'Screening').toLowerCase();
      if (stage.includes('screen')) funnelCounts.screening += 1;
      else if (stage.includes('shortlist')) funnelCounts.shortlisted += 1;
      else if (stage.includes('interview')) funnelCounts.interview += 1;
      else if (stage.includes('select')) funnelCounts.selected += 1;
      else if (stage.includes('offer')) funnelCounts.offered += 1;
      else if (stage.includes('hire')) funnelCounts.hired += 1;
      else if (stage.includes('reject')) funnelCounts.rejected += 1;
      else funnelCounts.screening += 1;

      if (c.appliedDate && c.hiredDate) {
        const appD = new Date(c.appliedDate);
        const hireD = new Date(c.hiredDate);
        if (!isNaN(appD.getTime()) && !isNaN(hireD.getTime())) {
          const days = Math.max(0, Math.round((hireD.getTime() - appD.getTime()) / (1000 * 60 * 60 * 24)));
          totalTimeToHireDays += days;
          hiredCountForTimeToHire += 1;
        }
      }
    });

    const avgTimeToHire = hiredCountForTimeToHire > 0 ? (totalTimeToHireDays / hiredCountForTimeToHire).toFixed(1) : 'Data not available';

    const headers = [
      'Candidate ID',
      'Candidate Name',
      'Applied Job Title',
      'Funnel Stage',
      'Candidate Source',
      'Applied Date',
      'Offer / Hire Date',
      'Time to Hire (Days)',
    ];

    const rows = candidates.map((c) => {
      const jobTitle = c.jobTitle || jobTitleMap[c.jobId] || 'Position';
      const appliedDate = c.appliedDate ? String(c.appliedDate).slice(0, 10) : 'N/A';
      const offerDate = c.offeredDate || c.hiredDate ? String(c.offeredDate || c.hiredDate).slice(0, 10) : 'N/A';
      const source = c.source || c.candidateSource || 'Career Portal';

      let timeToHire = 'N/A';
      if (c.appliedDate && c.hiredDate) {
        const appD = new Date(c.appliedDate);
        const hireD = new Date(c.hiredDate);
        if (!isNaN(appD.getTime()) && !isNaN(hireD.getTime())) {
          timeToHire = String(Math.max(0, Math.round((hireD.getTime() - appD.getTime()) / (1000 * 60 * 60 * 24))));
        }
      }

      return [
        c.id || c._id.toString(),
        c.fullName || c.name || 'Candidate',
        jobTitle,
        c.stage || c.status || 'Screening',
        source,
        appliedDate,
        offerDate,
        timeToHire,
      ];
    });

    const summaryMetrics = [
      { label: 'Total Applicants', value: candidates.length },
      { label: 'Shortlisted', value: funnelCounts.shortlisted },
      { label: 'In Interview', value: funnelCounts.interview },
      { label: 'Offered / Hired', value: funnelCounts.offered + funnelCounts.hired },
      { label: 'Avg Time to Hire', value: avgTimeToHire === 'Data not available' ? 'N/A' : `${avgTimeToHire} Days` },
    ];

    if (format === 'csv') {
      const csvStr = generateCSV(headers, rows);
      return new NextResponse(csvStr, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Recruitment_Funnel_Report.csv"',
        },
      });
    }

    if (format === 'excel') {
      const excelXml = generateExcelXML(
        'Recruitment Funnel Report',
        {},
        headers,
        rows
      );
      return new NextResponse(excelXml, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': 'attachment; filename="Recruitment_Funnel_Report.xls"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportTitle: 'Recruitment Funnel Report',
      count: candidates.length,
      funnelCounts,
      summaryMetrics,
      headers,
      data: candidates.map((c, idx) => ({
        id: c.id || c._id.toString(),
        candidateId: rows[idx][0],
        name: rows[idx][1],
        jobTitle: rows[idx][2],
        stage: rows[idx][3],
        source: rows[idx][4],
        appliedDate: rows[idx][5],
        offerDate: rows[idx][6],
        timeToHire: rows[idx][7],
      })),
    });
  } catch (error: any) {
    console.error('Error generating recruitment report:', error);
    return NextResponse.json({ success: false, message: error.message || 'Error generating recruitment report' }, { status: 500 });
  }
}
