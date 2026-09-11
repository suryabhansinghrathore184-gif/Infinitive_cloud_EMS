import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized. Missing authorization token.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: 'usr-admin-01',
        employeeId: 'EMP9201',
        name: 'Suryabhan Singh Rathore',
        email: 'admin@organization.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
        role: 'HR/Admin',
        department: 'Human Resources',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user session.' },
      { status: 401 }
    );
  }
}
