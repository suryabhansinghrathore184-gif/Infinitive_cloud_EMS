/**
 * Direct MongoDB Seeder Script for MongoDB Compass & Local Database
 * Database Name: ems_hrms_db
 * Connection String: mongodb://localhost:27017/ems_hrms_db
 */

const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ems_hrms_db';
const client = new MongoClient(uri);

async function seedMongoDbCompass() {
  console.log('🚀 Connecting to Local MongoDB Server at mongodb://localhost:27017...');

  try {
    await client.connect();
    const db = client.db('ems_hrms_db');
    console.log('✅ Connected to database: "ems_hrms_db"');

    // 1. Seed Departments
    const deptEngineeringId = new ObjectId();
    const deptHrId = new ObjectId();
    const deptSalesId = new ObjectId();
    const deptFinanceId = new ObjectId();

    const departments = [
      { _id: deptEngineeringId, name: 'Engineering & IT', code: 'ENG', description: 'Software Development & Tech Infrastructure', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: deptHrId, name: 'Human Resources', code: 'HR', description: 'People Operations & Talent Acquisition', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: deptSalesId, name: 'Sales & Business Development', code: 'SBD', description: 'Enterprise Sales & Partnerships', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: deptFinanceId, name: 'Finance & Accounts', code: 'FIN', description: 'Financial Planning & Payroll Accounting', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    await db.collection('departments').deleteMany({});
    await db.collection('departments').insertMany(departments);
    console.log(`📦 Created ${departments.length} records in 'departments' collection.`);

    // 2. Seed Designations
    const desgSrDevId = new ObjectId();
    const desgHrMgrId = new ObjectId();
    const desgEngMgrId = new ObjectId();

    const designations = [
      { _id: desgSrDevId, title: 'Senior Software Engineer', code: 'SSE', departmentId: deptEngineeringId, createdAt: new Date(), updatedAt: new Date() },
      { _id: desgEngMgrId, title: 'Engineering Manager', code: 'EM', departmentId: deptEngineeringId, createdAt: new Date(), updatedAt: new Date() },
      { _id: desgHrMgrId, title: 'HR Administrator', code: 'HRA', departmentId: deptHrId, createdAt: new Date(), updatedAt: new Date() },
    ];

    await db.collection('designations').deleteMany({});
    await db.collection('designations').insertMany(designations);
    console.log(`📦 Created ${designations.length} records in 'designations' collection.`);

    // 3. Seed Users (Hashed Passwords)
    const userAdminId = new ObjectId();
    const userSuperId = new ObjectId();
    const userManagerId = new ObjectId();
    const userEmployeeId = new ObjectId();

    const users = [
      { _id: userAdminId, email: 'admin@organization.com', passwordHash: 'admin123', isActive: true, isEmailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: userSuperId, email: 'superadmin@organization.com', passwordHash: 'super123', isActive: true, isEmailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: userManagerId, email: 'manager@organization.com', passwordHash: 'manager123', isActive: true, isEmailVerified: true, createdAt: new Date(), updatedAt: new Date() },
      { _id: userEmployeeId, email: 'employee@organization.com', passwordHash: 'emp123', isActive: true, isEmailVerified: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(users);
    console.log(`📦 Created ${users.length} records in 'users' collection.`);

    // 4. Seed Employees Master
    const empAdminId = new ObjectId();
    const empSuperId = new ObjectId();
    const empManagerId = new ObjectId();
    const empEmployeeId = new ObjectId();

    const employees = [
      {
        _id: empAdminId,
        employeeId: 'EMP9201',
        userId: userAdminId,
        firstName: 'Suryabhan Singh',
        lastName: 'Rathore',
        personalEmail: 'admin@organization.com',
        phone: '+91 98765 43210',
        joiningDate: new Date('2024-01-15'),
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        departmentId: deptHrId,
        designationId: desgHrMgrId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: empSuperId,
        employeeId: 'SUP0001',
        userId: userSuperId,
        firstName: 'Super',
        lastName: 'Administrator',
        personalEmail: 'superadmin@organization.com',
        phone: '+91 99999 88888',
        joiningDate: new Date('2023-06-01'),
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        departmentId: deptHrId,
        designationId: desgHrMgrId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: empManagerId,
        employeeId: 'MGR1001',
        userId: userManagerId,
        firstName: 'Vikramaditya',
        lastName: 'Sharma',
        personalEmail: 'manager@organization.com',
        phone: '+91 98111 22233',
        joiningDate: new Date('2024-03-10'),
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        departmentId: deptEngineeringId,
        designationId: desgEngMgrId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: empEmployeeId,
        employeeId: 'EMP1001',
        userId: userEmployeeId,
        firstName: 'Aarav',
        lastName: 'Sharma',
        personalEmail: 'employee@organization.com',
        phone: '+91 97777 66655',
        joiningDate: new Date('2024-05-20'),
        employmentType: 'FULL_TIME',
        employmentStatus: 'ACTIVE',
        departmentId: deptEngineeringId,
        designationId: desgSrDevId,
        managerId: empManagerId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    await db.collection('employees').deleteMany({});
    await db.collection('employees').insertMany(employees);
    console.log(`📦 Created ${employees.length} records in 'employees' collection.`);

    // 5. Seed Attendance Logs
    const attendanceLogs = [
      { _id: new ObjectId(), employeeId: empAdminId, date: new Date('2026-09-11'), status: 'PRESENT', method: 'WEB', workHours: 8.5, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empManagerId, date: new Date('2026-09-11'), status: 'PRESENT', method: 'MOBILE', workHours: 9.0, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empEmployeeId, date: new Date('2026-09-11'), status: 'PRESENT', method: 'GPS', workHours: 8.0, createdAt: new Date() },
    ];

    await db.collection('attendance').deleteMany({});
    await db.collection('attendance').insertMany(attendanceLogs);
    console.log(`📦 Created ${attendanceLogs.length} records in 'attendance' collection.`);

    // 6. Seed Salary Structures & Payroll
    const salaryStructures = [
      { _id: new ObjectId(), employeeId: empAdminId, ctc: 1200000, basic: 600000, hra: 240000, allowances: 200000, pf: 72000, pt: 2400, tds: 60000, netSalary: 905600, createdAt: new Date() },
      { _id: new ObjectId(), employeeId: empEmployeeId, ctc: 900000, basic: 450000, hra: 180000, allowances: 150000, pf: 54000, pt: 2400, tds: 45000, netSalary: 678600, createdAt: new Date() },
    ];

    await db.collection('salary_structures').deleteMany({});
    await db.collection('salary_structures').insertMany(salaryStructures);
    console.log(`📦 Created ${salaryStructures.length} records in 'salary_structures' collection.`);

    // 7. Seed Holidays
    const holidays = [
      { _id: new ObjectId(), name: 'Republic Day', date: new Date('2026-01-26'), category: 'NATIONAL_HOLIDAY', country: 'IN', isMandatory: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      { _id: new ObjectId(), name: 'Independence Day', date: new Date('2026-08-15'), category: 'NATIONAL_HOLIDAY', country: 'IN', isMandatory: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      { _id: new ObjectId(), name: 'Gandhi Jayanti', date: new Date('2026-10-02'), category: 'NATIONAL_HOLIDAY', country: 'IN', isMandatory: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
      { _id: new ObjectId(), name: 'Diwali Festival', date: new Date('2026-11-08'), category: 'COMPANY_FESTIVAL', country: 'IN', isMandatory: true, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() },
    ];

    await db.collection('holidays').deleteMany({});
    await db.collection('holidays').insertMany(holidays);
    console.log(`📦 Created ${holidays.length} records in 'holidays' collection.`);

    // 8. Seed Audit Logs
    const auditLogs = [
      { _id: new ObjectId(), userId: userAdminId, action: 'SYSTEM_INITIALIZATION', entity: 'DATABASE', ipAddress: '127.0.0.1', createdAt: new Date() },
      { _id: new ObjectId(), userId: userAdminId, action: 'MONGODB_COMPASS_SEED', entity: 'COLLECTIONS', ipAddress: '127.0.0.1', createdAt: new Date() },
    ];

    await db.collection('audit_logs').deleteMany({});
    await db.collection('audit_logs').insertMany(auditLogs);
    console.log(`📦 Created ${auditLogs.length} records in 'audit_logs' collection.`);

    console.log('\n=============================================================');
    console.log('🎉 ALL COLLECTIONS SUCCESSFULLY CREATED IN MONGODB COMPASS!');
    console.log('Database Name: ems_hrms_db');
    console.log('Connection URI: mongodb://localhost:27017');
    console.log('=============================================================\n');

  } catch (err) {
    console.error('❌ Error seeding MongoDB:', err);
  } finally {
    await client.close();
  }
}

seedMongoDbCompass();
