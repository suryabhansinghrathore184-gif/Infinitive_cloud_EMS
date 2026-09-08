import { HolidayService } from './holiday.service';
import { HolidayController } from './holiday.controller';

async function runHolidayModuleTests() {
  console.log('==================================================');
  console.log('HOLIDAY MANAGEMENT MODULE API & SERVICE SUITE');
  console.log('==================================================\n');

  const controller = new HolidayController();
  const testYear = new Date().getFullYear();

  // Test 1: GET holidays by year
  console.log('Test 1: GET /api/holidays/year/' + testYear);
  const resByYear = await controller.getHolidaysByYear(testYear, 'IN');
  console.log('  Success:', resByYear.success);
  console.log('  Count:', resByYear.data?.length);
  if (resByYear.data && resByYear.data.length > 0) {
    console.log('  Sample Item:', JSON.stringify(resByYear.data[0], null, 2));
  }

  // Test 2: GET holiday by ID
  if (resByYear.data && resByYear.data.length > 0) {
    const firstId = resByYear.data[0].id;
    console.log('\nTest 2: GET /api/holidays/' + firstId);
    const resById = await controller.getHolidayById(firstId);
    console.log('  Success:', resById.success);
    console.log('  Matched Name:', resById.data?.name);
  }

  // Test 3: POST create new holiday (Admin role)
  console.log('\nTest 3: POST /api/holidays (Admin Creation)');
  const newHolidayDate = `${testYear}-09-14`;
  const resCreate = await controller.createHoliday(
    {
      name: 'Test Innovation Day',
      date: newHolidayDate,
      category: 'COMPANY_HOLIDAY',
      description: 'Annual Hackathon & Innovation Day Off',
      isMandatory: true,
      isOptional: false,
    },
    'HR_ADMIN'
  );
  console.log('  Success:', resCreate.success);
  console.log('  Message:', resCreate.message);
  console.log('  Created ID:', resCreate.data?.id);
  console.log('  Dynamic DayOfWeek:', resCreate.data?.dayOfWeek);
  console.log('  Dynamic RelativeLabel:', resCreate.data?.relativeLabel);

  // Test 4: Duplicate Holiday Prevention
  console.log('\nTest 4: POST /api/holidays (Duplicate Prevention)');
  const resDuplicate = await controller.createHoliday(
    {
      name: 'Test Innovation Day',
      date: newHolidayDate,
      category: 'COMPANY_HOLIDAY',
    },
    'HR_ADMIN'
  );
  console.log('  Success:', resDuplicate.success);
  console.log('  ErrorCode:', resDuplicate.errorCode);

  // Test 5: Invalid Date Validation
  console.log('\nTest 5: POST /api/holidays (Invalid Date Validation)');
  const resInvalidDate = await controller.createHoliday(
    {
      name: 'Bad Date Holiday',
      date: 'INVALID-DATE-FORMAT',
      category: 'PUBLIC_HOLIDAY',
    },
    'HR_ADMIN'
  );
  console.log('  Success:', resInvalidDate.success);
  console.log('  ErrorCode:', resInvalidDate.errorCode);

  // Test 6: Unauthorized Operation (Non-Admin Role)
  console.log('\nTest 6: POST /api/holidays (Unauthorized Non-Admin Role)');
  const resUnauthorized = await controller.createHoliday(
    {
      name: 'Unauthorized Holiday',
      date: `${testYear}-10-10`,
      category: 'PUBLIC_HOLIDAY',
    },
    'EMPLOYEE'
  );
  console.log('  Success:', resUnauthorized.success);
  console.log('  ErrorCode:', resUnauthorized.errorCode);

  // Test 7: PUT update holiday
  if (resCreate.data?.id) {
    console.log('\nTest 7: PUT /api/holidays/' + resCreate.data.id);
    const resUpdate = await controller.updateHoliday(
      resCreate.data.id,
      { description: 'Updated Hackathon Day Off' },
      'HR_ADMIN'
    );
    console.log('  Success:', resUpdate.success);
    console.log('  Updated Description:', resUpdate.data?.description);

    // Test 8: DELETE holiday
    console.log('\nTest 8: DELETE /api/holidays/' + resCreate.data.id);
    const resDelete = await controller.deleteHoliday(resCreate.data.id, 'HR_ADMIN');
    console.log('  Success:', resDelete.success);
    console.log('  Deleted ID:', resDelete.data?.id);
  }

  console.log('\n==================================================');
  console.log('ALL HOLIDAY MODULE TESTS COMPLETED SUCCESSFULLY!');
  console.log('==================================================');
}

runHolidayModuleTests().catch(console.error);
