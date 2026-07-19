import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Showroom from '@/models/Showroom';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const showrooms = await Showroom.find({})
      .populate('manager', 'name email phone')
      .sort({ createdAt: -1 });

    return NextResponse.json({ showrooms });
  } catch (error) {
    console.error('Fetch Showrooms Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, address, image, manager } = await req.json();

    if (!name || !manager) {
      return NextResponse.json({ message: 'Name and Manager are required' }, { status: 400 });
    }

    await connectToDatabase();

    // Verify manager exists and is a manager
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return NextResponse.json({ message: 'Manager user not found' }, { status: 404 });
    }

    if (managerUser.role !== 'manager') {
      return NextResponse.json({ message: 'Selected user must have the manager role' }, { status: 400 });
    }

    // Check if this manager is already assigned to another showroom
    const existingShowroom = await Showroom.findOne({ manager });
    if (existingShowroom) {
      return NextResponse.json({ message: 'This manager is already assigned to showroom: ' + existingShowroom.name }, { status: 400 });
    }

    const newShowroom = await Showroom.create({
      name,
      address,
      image,
      manager,
      isActive: true,
    });

    return NextResponse.json({ 
      message: 'Showroom created successfully',
      showroom: newShowroom
    });
  } catch (error: any) {
    console.error('Create Showroom Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'This manager is already assigned to a showroom' }, { status: 400 });
    }
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, address, image, manager, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Showroom ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const showroom = await Showroom.findById(id);
    if (!showroom) {
      return NextResponse.json({ message: 'Showroom not found' }, { status: 404 });
    }

    if (manager && manager !== showroom.manager.toString()) {
      // Verify new manager exists and is a manager
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return NextResponse.json({ message: 'Manager user not found' }, { status: 404 });
      }

      if (managerUser.role !== 'manager') {
        return NextResponse.json({ message: 'Selected user must have the manager role' }, { status: 400 });
      }

      // Check if this manager is already assigned to another showroom
      const existingShowroom = await Showroom.findOne({ manager, _id: { $ne: id } });
      if (existingShowroom) {
        return NextResponse.json({ message: 'This manager is already assigned to showroom: ' + existingShowroom.name }, { status: 400 });
      }
      showroom.manager = manager;
    }

    if (name) showroom.name = name;
    if (address !== undefined) showroom.address = address;
    if (image !== undefined) showroom.image = image;
    if (isActive !== undefined) showroom.isActive = isActive;

    await showroom.save();

    return NextResponse.json({ 
      message: 'Showroom updated successfully',
      showroom
    });
  } catch (error: any) {
    console.error('Update Showroom Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    
    if (!session || (userRole !== 'admin' && userRole !== 'super_admin')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Showroom ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    await Showroom.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Showroom deleted successfully' });
  } catch (error: any) {
    console.error('Delete Showroom Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
