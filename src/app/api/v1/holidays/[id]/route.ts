import { NextRequest, NextResponse } from 'next/server';
import { HolidayController } from '@/modules/holidays/holiday.controller';

export const dynamic = 'force-dynamic';

const controller = new HolidayController();

// GET /api/v1/holidays/:id
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await controller.getHolidayById(params.id);
  return NextResponse.json(result, { status: result.success ? 200 : 404 });
}

// PUT /api/v1/holidays/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const roleHeader = req.headers.get('x-user-role') || 'HR_ADMIN';

    const result = await controller.updateHoliday(params.id, body, roleHeader);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Invalid request body',
        errorCode: 'INVALID_REQUEST_BODY',
      },
      { status: 400 }
    );
  }
}

// DELETE /api/v1/holidays/:id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const roleHeader = req.headers.get('x-user-role') || 'HR_ADMIN';
  const result = await controller.deleteHoliday(params.id, roleHeader);
  return NextResponse.json(result, { status: result.success ? 200 : 400 });
}
