import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';
import EmployeeProfile from '@/models/EmployeeProfile';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, image, employeeType, baseSalary, taskRate, appointmentLetter, joinedDate } = body;

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user || user.role !== 'employee') {
      return NextResponse.json({ message: 'Employee not found' }, { status: 404 });
    }

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (image !== undefined) user.image = image;
    await user.save();

    let profile = await EmployeeProfile.findOne({ user: id });
    if (!profile) {
      profile = await EmployeeProfile.create({
        user: id,
        employeeType: employeeType || 'monthly',
        baseSalary: baseSalary ? Number(baseSalary) : 0,
        taskRate: taskRate ? Number(taskRate) : 0,
        appointmentLetter: appointmentLetter || '',
        joinedDate: joinedDate ? new Date(joinedDate) : new Date()
      });
    } else {
      if (employeeType) profile.employeeType = employeeType;
      if (baseSalary !== undefined) profile.baseSalary = Number(baseSalary);
      if (taskRate !== undefined) profile.taskRate = Number(taskRate);
      if (appointmentLetter !== undefined) profile.appointmentLetter = appointmentLetter;
      if (joinedDate) profile.joinedDate = new Date(joinedDate);
      await profile.save();
    }

    return NextResponse.json({
      message: 'Employee updated successfully',
      employee: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        employeeType: profile.employeeType,
        baseSalary: profile.baseSalary,
        taskRate: profile.taskRate,
        appointmentLetter: profile.appointmentLetter,
        joinedDate: profile.joinedDate
      }
    });
  } catch (error: any) {
    console.error('Update Employee Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Revoke employee role back to 'user' or delete completely?
    // Demoting their role to 'user' is safer than full deletion to preserve checkout history,
    // but deleting the EmployeeProfile details is clean.
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.role = 'user';
    await user.save();

    await EmployeeProfile.findOneAndDelete({ user: id });

    return NextResponse.json({ message: 'Employee role revoked successfully' });
  } catch (error: any) {
    console.error('Delete Employee Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
