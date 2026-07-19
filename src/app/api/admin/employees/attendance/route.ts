import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Attendance from '@/models/Attendance';
import User from '@/models/User';

// Helper to get local YYYY-MM-DD
function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let query: any = {};
    if (userRole === 'employee') {
      query.employee = userId;
    } else if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    } else {
      // Admin filter options
      const { searchParams } = new URL(req.url);
      const employeeFilter = searchParams.get('employeeId');
      const dateFilter = searchParams.get('date');
      if (employeeFilter) query.employee = employeeFilter;
      if (dateFilter) query.date = dateFilter;
    }

    const attendance = await Attendance.find(query)
      .populate('employee', 'name email phone')
      .sort({ date: -1 });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    console.error('Fetch Attendance Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, employeeId } = body;

    let targetEmployee = userId;
    if (['admin', 'super_admin'].includes(userRole) && employeeId) {
      targetEmployee = employeeId;
    }

    if (!action || !['check-in', 'check-out'].includes(action)) {
      return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    await connectToDatabase();

    const todayDateStr = getLocalDateString();

    if (action === 'check-in') {
      // Check if already checked in
      const existing = await Attendance.findOne({ employee: targetEmployee, date: todayDateStr });
      if (existing) {
        return NextResponse.json({ message: 'Already checked in for today', attendance: existing }, { status: 400 });
      }

      // Check if check-in is late (e.g. after 10:00 AM local time)
      const now = new Date();
      const status = now.getHours() >= 10 ? 'Late' : 'Present';

      const attendance = await Attendance.create({
        employee: targetEmployee,
        date: todayDateStr,
        status,
        checkIn: now
      });

      return NextResponse.json({ message: 'Checked in successfully', attendance });
    } else {
      // Action is check-out
      const attendance = await Attendance.findOne({ employee: targetEmployee, date: todayDateStr });
      if (!attendance) {
        return NextResponse.json({ message: 'No check-in record found for today' }, { status: 404 });
      }

      if (attendance.checkOut) {
        return NextResponse.json({ message: 'Already checked out for today', attendance }, { status: 400 });
      }

      attendance.checkOut = new Date();
      await attendance.save();

      return NextResponse.json({ message: 'Checked out successfully', attendance });
    }
  } catch (error: any) {
    console.error('Submit Attendance Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
