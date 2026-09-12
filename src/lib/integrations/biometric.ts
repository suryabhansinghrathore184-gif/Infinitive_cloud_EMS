import { connectToDatabase } from '@/lib/mongodb';

export interface BiometricEmployeeMapping {
  deviceUserId: string;
  emsEmployeeId: string;
  employeeName: string;
}

export interface BiometricConfig {
  provider: 'ZKTeco' | 'Matrix' | 'Generic';
  deviceName: string;
  deviceId: string;
  connectorUrl: string; // Secure HTTPS endpoint of local gateway
  apiKey: string;
  authSecret?: string;
  syncMode: 'Realtime Push' | 'Scheduled Polling' | 'Manual';
  syncIntervalMinutes?: number;
  employeeMappings?: BiometricEmployeeMapping[];
}

export interface RawBiometricPunch {
  biometricPunchId?: string;
  deviceId?: string;
  deviceUserId: string;
  timestamp: string; // ISO or YYYY-MM-DD HH:mm:ss
  punchType?: 'IN' | 'OUT' | 'AUTO';
  locationId?: string;
}

export interface BiometricTestResult {
  provider: 'biometric';
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED';
  deviceName?: string;
  deviceId?: string;
  connectorUrl?: string;
  testedAt: string;
  message: string;
}

export interface BiometricSyncResult {
  success: boolean;
  importedCount: number;
  skippedCount: number;
  duplicatesCount: number;
  unmatchedCount: number;
  unmatchedDeviceUsers: string[];
  message: string;
  syncedAt: string;
}

/**
 * Tests local biometric connector endpoint via server-side HTTPS ping.
 */
export async function testBiometricConnection(
  config?: BiometricConfig
): Promise<BiometricTestResult> {
  const nowISO = new Date().toISOString();

  const connectorUrl = config?.connectorUrl || process.env.BIOMETRIC_CONNECTOR_URL || '';
  const apiKey = config?.apiKey || process.env.BIOMETRIC_API_KEY || '';
  const deviceName = config?.deviceName || 'ZKTeco Gateway';
  const deviceId = config?.deviceId || 'DEV-ZKT-01';

  if (!connectorUrl || !apiKey) {
    return {
      provider: 'biometric',
      status: 'NOT_CONFIGURED',
      testedAt: nowISO,
      message: 'Biometric Gateway missing configuration. Connector URL and API Key are required.',
    };
  }

  try {
    const pingUrl = `${connectorUrl.replace(/\/$/, '')}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'x-biometric-key': apiKey,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    }).catch((fetchErr) => {
      // In case local connector URL ping is unreachable
      throw new Error(`Connector endpoint unreachable: ${fetchErr.message}`);
    });

    clearTimeout(timeoutId);

    if (res && (res.ok || res.status === 200 || res.status === 204)) {
      return {
        provider: 'biometric',
        status: 'CONNECTED',
        deviceName,
        deviceId,
        connectorUrl,
        testedAt: nowISO,
        message: `Biometric Gateway Connected! Device '${deviceName}' (${deviceId}) online via Local Connector.`,
      };
    }

    return {
      provider: 'biometric',
      status: 'CONNECTION_FAILED',
      deviceName,
      deviceId,
      connectorUrl,
      testedAt: nowISO,
      message: 'Unable to connect to biometric device connector.',
    };
  } catch (err: any) {
    console.error('Biometric Connection Test Error:', err);
    return {
      provider: 'biometric',
      status: 'CONNECTION_FAILED',
      deviceName,
      deviceId,
      connectorUrl,
      testedAt: nowISO,
      message: 'Unable to connect to biometric device.',
    };
  }
}

/**
 * Normalizes, maps, deduplicates, and saves biometric punches into the `attendance` collection.
 */
export async function processBiometricPunches(
  organizationId: string,
  punches: RawBiometricPunch[],
  customMappings: BiometricEmployeeMapping[] = []
): Promise<BiometricSyncResult> {
  const nowISO = new Date().toISOString();
  const { db } = await connectToDatabase();

  let importedCount = 0;
  let skippedCount = 0;
  let duplicatesCount = 0;
  let unmatchedCount = 0;
  const unmatchedDeviceUsers: string[] = [];

  // Fetch organization employees to build lookup maps
  const employees = await db.collection('employees').find({ organizationId }).toArray();
  const empMapByDeviceUserId = new Map<string, any>();
  const empMapByEmsId = new Map<string, any>();

  employees.forEach((emp) => {
    empMapByEmsId.set(emp.employeeId, emp);
    if (emp.deviceUserId || emp.biometricId) {
      empMapByDeviceUserId.set(String(emp.deviceUserId || emp.biometricId), emp);
    }
  });

  // Apply explicit custom mappings from configuration
  customMappings.forEach((m) => {
    if (m.deviceUserId && m.emsEmployeeId) {
      const foundEmp = empMapByEmsId.get(m.emsEmployeeId);
      if (foundEmp) {
        empMapByDeviceUserId.set(String(m.deviceUserId), foundEmp);
      }
    }
  });

  for (const punch of punches) {
    const rawDeviceUserId = String(punch.deviceUserId || '').trim();
    if (!rawDeviceUserId) {
      skippedCount++;
      continue;
    }

    // Match employee
    let targetEmployee = empMapByDeviceUserId.get(rawDeviceUserId) || empMapByEmsId.get(rawDeviceUserId);

    if (!targetEmployee) {
      unmatchedCount++;
      if (!unmatchedDeviceUsers.includes(rawDeviceUserId)) {
        unmatchedDeviceUsers.push(rawDeviceUserId);
      }
      continue;
    }

    const punchDate = new Date(punch.timestamp);
    if (isNaN(punchDate.getTime())) {
      skippedCount++;
      continue;
    }

    const dateStr = punchDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = punchDate.toTimeString().split(' ')[0].slice(0, 5); // HH:mm

    // Deduplication check against existing attendance
    const existingAttendance = await db.collection('attendance').findOne({
      organizationId,
      employeeId: targetEmployee.employeeId,
      date: dateStr,
    });

    if (existingAttendance) {
      // Check if punch already exists
      const isDuplicateIn = existingAttendance.checkInTime === timeStr;
      const isDuplicateOut = existingAttendance.checkOutTime === timeStr;

      if (isDuplicateIn || isDuplicateOut) {
        duplicatesCount++;
        continue;
      }

      // Update checkOutTime or status
      const updateDoc: any = { updatedAt: nowISO };
      if (!existingAttendance.checkOutTime && timeStr > (existingAttendance.checkInTime || '')) {
        updateDoc.checkOutTime = timeStr;
        // Compute working hours
        if (existingAttendance.checkInTime) {
          const [inH, inM] = existingAttendance.checkInTime.split(':').map(Number);
          const [outH, outM] = timeStr.split(':').map(Number);
          const totalMins = Math.max(0, (outH * 60 + outM) - (inH * 60 + inM));
          updateDoc.workHours = (totalMins / 60).toFixed(2);
        }
      }

      await db.collection('attendance').updateOne(
        { _id: existingAttendance._id },
        { $set: updateDoc }
      );
      importedCount++;
    } else {
      // Create new attendance record with method 'Biometric'
      const newAttendance = {
        id: `att-bio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        organizationId,
        employeeId: targetEmployee.employeeId,
        employeeName: `${targetEmployee.firstName || ''} ${targetEmployee.lastName || ''}`.trim(),
        department: targetEmployee.department || 'General',
        date: dateStr,
        checkInTime: timeStr,
        checkOutTime: '',
        status: 'Present',
        method: 'Biometric',
        deviceUserId: rawDeviceUserId,
        biometricPunchId: punch.biometricPunchId || `p-${Date.now()}`,
        workHours: '0.00',
        createdAt: nowISO,
        updatedAt: nowISO,
      };

      await db.collection('attendance').insertOne(newAttendance);
      importedCount++;
    }
  }

  // Save sync metrics history in `biometric_sync_logs`
  await db.collection('biometric_sync_logs').insertOne({
    organizationId,
    syncedAt: nowISO,
    importedCount,
    skippedCount,
    duplicatesCount,
    unmatchedCount,
    unmatchedDeviceUsers,
    totalProcessed: punches.length,
    status: 'SUCCESS',
  });

  return {
    success: true,
    importedCount,
    skippedCount,
    duplicatesCount,
    unmatchedCount,
    unmatchedDeviceUsers,
    message: `Biometric Punch Sync completed: ${importedCount} imported, ${duplicatesCount} duplicates, ${unmatchedCount} unmatched employees.`,
    syncedAt: nowISO,
  };
}
