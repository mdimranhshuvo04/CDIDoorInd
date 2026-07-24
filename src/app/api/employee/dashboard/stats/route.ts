import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import SalaryDisbursement from '@/models/SalaryDisbursement';
import Leave from '@/models/Leave';
import Task from '@/models/Task';
import EmployeeProfile from '@/models/EmployeeProfile';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || userRole !== 'employee') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Employee profile info
    const profile = await EmployeeProfile.findOne({ user: userId }).lean() as any;

    // This month's salary disbursements
    const monthSalaries = await SalaryDisbursement.find({
      employee: userId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();
    const monthSalaryTotal = monthSalaries.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

    // All salary total
    const allSalaries = await SalaryDisbursement.find({ employee: userId }).sort({ date: -1 }).limit(6).lean();

    // Leaves
    const pendingLeaves = await Leave.countDocuments({ employee: userId, status: 'Pending' });
    const approvedLeaves = await Leave.countDocuments({ employee: userId, status: 'Approved' });
    const recentLeaves = await Leave.find({ employee: userId }).sort({ createdAt: -1 }).limit(5).lean();

    // Tasks
    const pendingTasks = await Task.countDocuments({ employee: userId, status: 'Pending' });
    const completedTasks = await Task.countDocuments({ employee: userId, status: 'Completed' });
    const recentTasks = await Task.find({ employee: userId, status: { $in: ['Pending', 'Completed'] } })
      .sort({ assignedDate: -1 }).limit(5).lean();

    return NextResponse.json({
      profile: {
        employeeType: profile?.employeeType || 'monthly',
        baseSalary: profile?.baseSalary || 0,
        taskRate: profile?.taskRate || 0,
        joinedDate: profile?.joinedDate,
      },
      salary: {
        thisMonth: monthSalaryTotal,
        history: allSalaries,
      },
      leaves: { pending: pendingLeaves, approved: approvedLeaves, recent: recentLeaves },
      tasks: { pending: pendingTasks, completed: completedTasks, recent: recentTasks },
    });
  } catch (error: any) {
    console.error('Employee Dashboard Stats Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
