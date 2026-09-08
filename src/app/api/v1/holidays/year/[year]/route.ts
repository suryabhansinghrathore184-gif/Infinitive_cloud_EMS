import { NextRequest, NextResponse } from 'next/server';
import { HolidayController } from '@/modules/holidays/holiday.controller';

const controller = new HolidayController();

// GET /api/v1/holidays/year/:year
export async function GET(
  req: NextRequest,
  { params }: { params: { year: string } }
) {
  const yearNum = Number(params.year);
  const { searchParams } = new URL(req.url);
  const country = searchParams.get('country') || 'IN';

  if (isNaN(yearNum)) {
    return NextResponse.json(
      {
        success: false,
        message: 'Invalid year parameter. Must be a valid 4-digit number.',
        errorCode: 'INVALID_YEAR',
      },
      { status: 400 }
    );
  }

  const result = await controller.getHolidaysByYear(yearNum, country);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
