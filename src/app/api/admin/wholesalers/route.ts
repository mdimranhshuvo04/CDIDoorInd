import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;

    if (!session || !['admin', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find all users with role 'wholesaler'
    const wholesalers = await User.find({ role: 'wholesaler' }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ wholesalers });
  } catch (error: any) {
    console.error('Fetch Wholesalers Error:', error);
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
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      if (user.role === 'wholesaler') {
        return NextResponse.json({ message: 'Wholesaler with this email already exists' }, { status: 400 });
      }
      // Only allow upgrading plain user accounts
      if (user.role !== 'user') {
        return NextResponse.json({ message: 'This account cannot be assigned wholesaler status' }, { status: 400 });
      }
      user.role = 'wholesaler';
      if (name) user.name = name;
      if (phone) user.phone = phone;
      await user.save();
    } else {
      user = await User.create({
        name,
        email,
        password,
        phone,
        role: 'wholesaler'
      });
    }

    return NextResponse.json({
      message: 'Wholesaler registered successfully',
      wholesaler: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    console.error('Create Wholesaler Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
