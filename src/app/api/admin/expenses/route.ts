import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import Showroom from '@/models/Showroom';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const showroomFilter = searchParams.get('showroom');
    const isApprovedFilter = searchParams.get('isApproved');

    const query: any = {};
    if (category) query.category = category;
    
    if (userRole === 'manager') {
      const showroom = await Showroom.findOne({ manager: (session.user as any).id || (session.user as any)._id });
      if (!showroom) {
        return NextResponse.json([]); // Return empty if manager has no assigned showroom
      }
      query.showroom = showroom._id;
    } else {
      // Admin/Super Admin filters
      if (showroomFilter) query.showroom = showroomFilter;
    }

    if (isApprovedFilter !== null && isApprovedFilter !== undefined) {
      query.isApproved = isApprovedFilter === 'true';
    }
    
    if (from || to) {
      const dateQuery: any = {};
      
      if (from) {
        const fromDate = new Date(from);
        if (isNaN(fromDate.getTime())) {
          return NextResponse.json({ message: 'Invalid "from" date format' }, { status: 400 });
        }
        dateQuery.$gte = fromDate;
      }
      
      if (to) {
        const toDate = new Date(to);
        if (isNaN(toDate.getTime())) {
          return NextResponse.json({ message: 'Invalid "to" date format' }, { status: 400 });
        }
        dateQuery.$lte = toDate;
      }
      
      query.date = dateQuery;
    }

    const expenses = await Expense.find(query)
      .populate('showroom', 'name')
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, amount, category, date, description, showroom: requestedShowroom } = body;

    // Validate required fields
    if (!title || amount === undefined || !category) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    let showroomId: any = undefined;
    let autoApprove = false;

    if (userRole === 'manager') {
      const managerShowroom = await Showroom.findOne({ manager: userId });
      if (!managerShowroom) {
        return NextResponse.json({ message: 'You are not assigned to any showroom' }, { status: 400 });
      }
      showroomId = managerShowroom._id;
      autoApprove = false; // Manager expenses require admin approval
    } else {
      // Admin/Super Admin
      showroomId = requestedShowroom || undefined;
      autoApprove = true; // Admin expenses are auto-approved
    }

    // Build payload
    const safePayload = {
      title,
      amount,
      category,
      date: date ? new Date(date) : new Date(),
      description,
      showroom: showroomId,
      isApproved: autoApprove,
      createdBy: userId,
    };
    
    const expense = await Expense.create(safePayload);

    // Log to ledger only if approved
    if (autoApprove) {
      try {
        const { logLedgerTransaction } = await import('@/lib/ledgerHelper');
        // Credit Cash (decreases cash asset)
        await logLedgerTransaction(
          'CASH',
          'credit',
          amount,
          `Expense Paid: ${title} (${category})`,
          expense._id.toString()
        );
      } catch (err) {
        console.error('Error logging expense to ledger:', err);
      }
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
