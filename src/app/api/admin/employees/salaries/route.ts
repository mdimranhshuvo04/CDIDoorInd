import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import SalaryDisbursement from '@/models/SalaryDisbursement';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    let query: any = {};
    if (userRole === 'employee') {
      query.employee = userId;
    } else if (!['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const disbursements = await SalaryDisbursement.find(query)
      .populate('employee', 'name email phone')
      .sort({ date: -1 });

    return NextResponse.json({ disbursements });
  } catch (error: any) {
    console.error('Fetch Disbursements Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, amount, type, remarks, date } = body;

    if (!employeeId || !amount || !type) {
      return NextResponse.json({ message: 'Missing required disbursement fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify employee exists
    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return NextResponse.json({ message: 'Employee user not found' }, { status: 404 });
    }

    const disbursement = await SalaryDisbursement.create({
      employee: employeeId,
      amount: Number(amount),
      type,
      remarks: remarks || '',
      date: date ? new Date(date) : new Date()
    });

    return NextResponse.json({
      message: 'Disbursement logged successfully',
      disbursement
    });
  } catch (error: any) {
    console.error('Create Disbursement Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
