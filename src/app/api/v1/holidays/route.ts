import { NextRequest, NextResponse } from 'next/server';
import { HolidayController } from '@/modules/holidays/holiday.controller';
import { QueryHolidayFilterDto } from '@/modules/holidays/holiday.dto';

const controller = new HolidayController();

// GET /api/v1/holidays
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const filter: QueryHolidayFilterDto = {
    year: searchParams.get('year') ? Number(searchParams.get('year')) : undefined,
    country: searchParams.get('country') || undefined,
    category: (searchParams.get('category') as any) || undefined,
    state: searchParams.get('state') || undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 50,
  };

  const result = await controller.getHolidays(filter);
  const status = result.success ? 200 : 400;
  return NextResponse.json(result, { status });
}

// POST /api/v1/holidays
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const roleHeader = req.headers.get('x-user-role') || 'HR_ADMIN';

    const result = await controller.createHoliday(body, roleHeader);
    const status = result.success ? 201 : 400;
    return NextResponse.json(result, { status });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Invalid JSON body',
        errorCode: 'INVALID_REQUEST_BODY',
      },
      { status: 400 }
    );
  }
}
