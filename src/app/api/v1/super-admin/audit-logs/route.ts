import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthContext, checkPermissions } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

function getCategoryForAction(action: string): string {
  const act = (action || '').toUpperCase();
  if (act.includes('LOGIN_FAILED') || act === 'LOGIN_SUCCESS' || act === 'LOGIN') return 'LOGIN';
  if (act.includes('OTP')) return 'OTP';
  if (act === 'LOGOUT') return 'LOGOUT';
  if (act.includes('ROLE') || act.includes('PERMISSION')) return 'ROLE CHANGES';
  if (act.includes('ORGANIZATION') || act.includes('ORG_')) return 'ORGANIZATION CHANGES';
  if (act.includes('EMPLOYEE')) return 'EMPLOYEE CHANGES';
  if (act.includes('USER_') || act.includes('ACCOUNT_')) return 'USER CHANGES';
  if (act.includes('LEAVE')) return 'LEAVE';
  if (act.includes('PAYROLL') || act.includes('SALARY')) return 'PAYROLL';
  if (act.includes('SESSION') || act.includes('REVOKE')) return 'SESSION REVOCATION';
  if (act.includes('SECURITY') || act.includes('DIAGNOSTIC') || act.includes('UNAUTHORIZED')) return 'SECURITY EVENTS';
  if (act.includes('SETTING')) return 'SETTINGS CHANGES';
  if (act.includes('INTEGRATION') || act.includes('BIOMETRIC')) return 'INTEGRATION EVENTS';
  return 'GENERAL';
}

function getSeverityForAction(action: string): 'INFO' | 'WARNING' | 'CRITICAL' {
  const act = (action || '').toUpperCase();
  if (act.includes('REVOKE') || act.includes('LOCKED') || act.includes('UNAUTHORIZED') || act.includes('DELETED')) {
    return 'CRITICAL';
  }
  if (act.includes('FAILED') || act.includes('RESET') || act.includes('RESTORE') || act.includes('UPDATE')) {
    return 'WARNING';
  }
  return 'INFO';
}

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthContext(req);
    const perm = checkPermissions(auth, ['SUPER_ADMIN']);
    if (!perm.isAllowed) {
      return NextResponse.json({ success: false, message: perm.message }, { status: perm.statusCode });
    }

    const { db } = await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '25', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const categoryFilter = searchParams.get('category')?.trim() || 'All';
    const roleFilter = searchParams.get('role')?.trim() || 'All';
    const orgFilter = searchParams.get('organizationId')?.trim() || 'All';
    const timeFilter = searchParams.get('timeRange')?.trim() || 'All';
    const severityFilter = searchParams.get('severity')?.trim() || 'All';
    const exportFormat = searchParams.get('export')?.trim() || '';

    // 1. Fetch Executive Stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalEvents, logs24h, securityOverridesCount, orgDocs] = await Promise.all([
      db.collection('audit_logs').countDocuments(),
      db.collection('audit_logs').find({ timestamp: { $gte: last24h } }).toArray(),
      db.collection('audit_logs').countDocuments({
        action: { $regex: /REVOKE|SECURITY|ROLE|LOCKED|UNAUTHORIZED/i },
      }),
      db.collection('organization_settings').find({}).toArray(),
    ]);

    const activeActors24h = new Set(logs24h.map(l => l.performedBy || l.email).filter(Boolean)).size;

    // Build Organization map
    const orgMap = new Map<string, { id: string; name: string; code: string }>();
    orgDocs.forEach((doc) => {
      const orgId = doc.organizationId || doc._id.toString();
      const details = doc.organization || {};
      if (!orgMap.has(orgId)) {
        orgMap.set(orgId, {
          id: orgId,
          name: details.name || doc.name || 'Infinitive Cloud Solutions',
          code: details.code || doc.code || 'ICS-HQ',
        });
      }
    });

    if (!orgMap.has('org-default')) {
      orgMap.set('org-default', {
        id: 'org-default',
        name: 'Infinitive Cloud Solutions',
        code: 'ICS-HQ',
      });
    }

    const organizationsList = Array.from(orgMap.values());

    // 2. Build Query Filters
    let query: any = {};

    if (orgFilter !== 'All') {
      query.organizationId = orgFilter;
    }

    if (roleFilter !== 'All') {
      query.role = roleFilter;
    }

    if (timeFilter !== 'All') {
      if (timeFilter === '24h') query.timestamp = { $gte: last24h };
      else if (timeFilter === '7d') query.timestamp = { $gte: last7d };
      else if (timeFilter === '30d') query.timestamp = { $gte: last30d };
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { action: regex },
        { performedBy: regex },
        { performedByName: regex },
        { role: regex },
        { employeeId: regex },
        { organizationId: regex },
        { ipAddress: regex },
      ];
    }

    const allLogs = await db.collection('audit_logs').find(query).sort({ timestamp: -1, _id: -1 }).toArray();

    // Enrich logs with categories & severity
    let enrichedLogs = allLogs.map((log) => {
      const category = getCategoryForAction(log.action);
      const severity = getSeverityForAction(log.action);
      const orgId = log.organizationId || 'org-default';
      const orgInfo = orgMap.get(orgId) || {
        id: orgId,
        name: orgId === 'System Global' || orgId === 'GLOBAL' ? 'Global Platform' : orgId,
        code: orgId.slice(0, 6).toUpperCase(),
      };

      return {
        id: log._id.toString(),
        organizationId: orgId,
        organizationName: orgInfo.name,
        organizationCode: orgInfo.code,
        employeeId: log.employeeId || 'N/A',
        performedBy: log.performedBy || 'System Admin',
        performedByName: log.performedByName || log.performedBy || 'Admin User',
        role: log.role || 'SUPER_ADMIN',
        action: log.action || 'GENERAL_AUDIT',
        category,
        severity,
        details: log.details || {},
        oldValue: log.oldValue || null,
        newValue: log.newValue || null,
        ipAddress: log.ipAddress || '127.0.0.1',
        userAgent: log.userAgent || 'Web Client',
        timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
      };
    });

    // Apply category & severity filters in memory
    if (categoryFilter !== 'All') {
      enrichedLogs = enrichedLogs.filter(l => l.category === categoryFilter);
    }

    if (severityFilter !== 'All') {
      enrichedLogs = enrichedLogs.filter(l => l.severity === severityFilter);
    }

    const totalFilteredCount = enrichedLogs.length;

    // 3. Export Handling (CSV / JSON)
    if (exportFormat === 'csv') {
      await logAuditEvent(req, 'AUDIT_LOG_EXPORTED', {
        details: { totalExported: totalFilteredCount, format: 'csv', categoryFilter, roleFilter },
      });

      const csvHeaders = ['Event ID', 'Action Event', 'Category', 'Severity', 'Actor Email', 'Actor Name', 'Role', 'Organization', 'IP Address', 'Timestamp'];
      const csvRows = enrichedLogs.map(l => [
        `"${l.id}"`,
        `"${l.action}"`,
        `"${l.category}"`,
        `"${l.severity}"`,
        `"${l.performedBy}"`,
        `"${l.performedByName}"`,
        `"${l.role}"`,
        `"${l.organizationName}"`,
        `"${l.ipAddress}"`,
        `"${l.timestamp}"`,
      ].join(','));

      const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    if (exportFormat === 'json') {
      await logAuditEvent(req, 'AUDIT_LOG_EXPORTED', {
        details: { totalExported: totalFilteredCount, format: 'json', categoryFilter, roleFilter },
      });

      return new NextResponse(JSON.stringify(enrichedLogs, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Apply Pagination Slicing
    const paginatedLogs = enrichedLogs.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEvents,
          activeActors24h,
          securityOverridesCount,
          retentionPolicy: '90-Day Enterprise Immutable Policy (AES-256 Storage)',
        },
        filters: {
          categories: [
            'All',
            'LOGIN',
            'OTP',
            'LOGOUT',
            'USER CHANGES',
            'ROLE CHANGES',
            'ORGANIZATION CHANGES',
            'EMPLOYEE CHANGES',
            'LEAVE',
            'PAYROLL',
            'SECURITY EVENTS',
            'SESSION REVOCATION',
            'SETTINGS CHANGES',
            'INTEGRATION EVENTS',
          ],
          organizations: organizationsList,
          roles: ['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          severities: ['All', 'INFO', 'WARNING', 'CRITICAL'],
          timeRanges: ['All', '24h', '7d', '30d'],
        },
        logs: paginatedLogs,
        pagination: {
          total: totalFilteredCount,
          page,
          limit,
          totalPages: Math.ceil(totalFilteredCount / limit) || 1,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs stream:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to fetch audit logs' }, { status: 500 });
  }
}
