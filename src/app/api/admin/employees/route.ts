/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import EmployeeProfile from '@/models/EmployeeProfile';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find all users with role 'employee'
    const users = await User.find({ role: 'employee' }).sort({ createdAt: -1 });

    // Find all employee profiles
    const profiles = await EmployeeProfile.find({
      user: { $in: users.map((u) => u._id) }
    });

    // Map profiles by userId for quick lookup
    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    const employees = users.map((user) => {
      const profile = profileMap.get(user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        isActive: user.lastActive ? true : false,
        employeeType: profile?.employeeType || 'monthly',
        baseSalary: profile?.baseSalary || 0,
        taskRate: profile?.taskRate || 0,
        weekendDays: profile?.weekendDays || ['Friday'],
        allowedAbsents: profile?.allowedAbsents ?? 1,
        absentDeductionRate: profile?.absentDeductionRate || 0,
        basicSalary: profile?.basicSalary || 0,
        allowance: profile?.allowance || 0,
        deduction: profile?.deduction || 0,
        appointmentLetter: profile?.appointmentLetter || '',
        joinedDate: profile?.joinedDate || user.createdAt
      };
    });

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error('Fetch Employees Error:', error);
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
    const { 
      name, email, password, phone, image, employeeType, taskRate, appointmentLetter, joinedDate, userId,
      weekendDays, allowedAbsents, absentDeductionRate, basicSalary, allowance, deduction
    } = body;

    await connectToDatabase();

    let user;

    if (userId) {
      // Assign existing user
      user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      user.role = 'employee';
      if (phone) user.phone = phone;
      if (image) user.image = image;
      await user.save();
    } else {
      // Create new user
      if (!name || !email || !password) {
        return NextResponse.json({ message: 'Missing required user fields' }, { status: 400 });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ message: 'User with this email already exists' }, { status: 400 });
      }

      user = await User.create({
        name,
        email,
        password, // Pre-save hook hashes this
        phone,
        image,
        role: 'employee'
      });
    }

    // Calculate baseSalary based on structure if type is monthly
    const isMonthly = (employeeType || 'monthly') === 'monthly';
    const computedBaseSalary = isMonthly 
      ? Math.max(0, Number(basicSalary || 0) + Number(allowance || 0) - Number(deduction || 0))
      : 0;

    let profile = await EmployeeProfile.findOne({ user: user._id });
    if (!profile) {
      profile = await EmployeeProfile.create({
        user: user._id,
        employeeType: employeeType || 'monthly',
        baseSalary: computedBaseSalary,
        taskRate: taskRate ? Number(taskRate) : 0,
        weekendDays: weekendDays || ['Friday'],
        allowedAbsents: allowedAbsents !== undefined ? Number(allowedAbsents) : 1,
        absentDeductionRate: absentDeductionRate ? Number(absentDeductionRate) : 0,
        basicSalary: basicSalary ? Number(basicSalary) : 0,
        allowance: allowance ? Number(allowance) : 0,
        deduction: deduction ? Number(deduction) : 0,
        appointmentLetter: `/appointment-letter/${user._id}`,
        joinedDate: joinedDate ? new Date(joinedDate) : new Date()
      });
    } else {
      profile.employeeType = employeeType || 'monthly';
      profile.baseSalary = computedBaseSalary;
      profile.taskRate = taskRate ? Number(taskRate) : 0;
      profile.weekendDays = weekendDays || ['Friday'];
      profile.allowedAbsents = allowedAbsents !== undefined ? Number(allowedAbsents) : 1;
      profile.absentDeductionRate = absentDeductionRate ? Number(absentDeductionRate) : 0;
      profile.basicSalary = basicSalary ? Number(basicSalary) : 0;
      profile.allowance = allowance ? Number(allowance) : 0;
      profile.deduction = deduction ? Number(deduction) : 0;
      if (appointmentLetter !== undefined) profile.appointmentLetter = appointmentLetter;
      if (joinedDate) profile.joinedDate = new Date(joinedDate);
      await profile.save();
    }

    return NextResponse.json({
      message: 'Employee profile created successfully',
      employee: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        employeeType: profile.employeeType,
        baseSalary: profile.baseSalary,
        taskRate: profile.taskRate,
        weekendDays: profile.weekendDays,
        allowedAbsents: profile.allowedAbsents,
        absentDeductionRate: profile.absentDeductionRate,
        basicSalary: profile.basicSalary,
        allowance: profile.allowance,
        deduction: profile.deduction,
        appointmentLetter: profile.appointmentLetter,
        joinedDate: profile.joinedDate
      }
    });
  } catch (error: any) {
    console.error('Create Employee Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
