import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';
import Showroom from '@/models/Showroom';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid expense ID' }, { status: 400 });
    }

    await connectToDatabase();

    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    const body = await req.json();
    const { title, amount, category, date, description, isApproved } = body;
    
    // Authorization Check
    if (userRole === 'manager') {
      // Manager can only edit their own showroom's expenses and only if they are not approved yet
      const managerShowroom = await Showroom.findOne({ manager: userId });
      if (!managerShowroom || existingExpense.showroom?.toString() !== managerShowroom._id.toString()) {
        return NextResponse.json({ message: 'Unauthorized to modify this showroom expense' }, { status: 403 });
      }
      if (existingExpense.isApproved) {
        return NextResponse.json({ message: 'Cannot edit an already approved expense' }, { status: 400 });
      }
    }

    // Sanitize update data (whitelist)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (description !== undefined) updateData.description = description;

    const wasApproved = existingExpense.isApproved;
    
    if (['admin', 'super_admin'].includes(userRole)) {
      if (isApproved !== undefined) updateData.isApproved = isApproved;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id }, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    // Handle ledger tracking
    if (expense.isApproved) {
      try {
        const LedgerTransaction = (await import('@/models/LedgerTransaction')).default;
        const { recalculateLedgerBalance, logLedgerTransaction } = await import('@/lib/ledgerHelper');
        
        // Delete old ledger entries for this expense reference to prevent duplicates
        await LedgerTransaction.deleteMany({ reference: id });

        // Log the updated expense
        await logLedgerTransaction(
          'CASH',
          'credit',
          expense.amount,
          `Expense Paid: ${expense.title} (${expense.category})`,
          expense._id.toString()
        );
        // Recalculate Cash balance
        await recalculateLedgerBalance('CASH');
      } catch (err) {
        console.error('Error updating ledger on expense update:', err);
      }
    } else if (wasApproved && !expense.isApproved) {
      // If it was approved but now unapproved, delete related ledger transactions
      try {
        const LedgerTransaction = (await import('@/models/LedgerTransaction')).default;
        const { recalculateLedgerBalance } = await import('@/lib/ledgerHelper');
        await LedgerTransaction.deleteMany({ reference: id });
        await recalculateLedgerBalance('CASH');
      } catch (err) {
        console.error('Error removing ledger entries on unapproval:', err);
      }
    }
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
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
    const userId = (session?.user as any)?.id || (session?.user as any)?._id;

    if (!session || !(['admin', 'super_admin', 'manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid expense ID' }, { status: 400 });
    }

    await connectToDatabase();

    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    if (userRole === 'manager') {
      const managerShowroom = await Showroom.findOne({ manager: userId });
      if (!managerShowroom || existingExpense.showroom?.toString() !== managerShowroom._id.toString()) {
        return NextResponse.json({ message: 'Unauthorized to delete this showroom expense' }, { status: 403 });
      }
      if (existingExpense.isApproved) {
        return NextResponse.json({ message: 'Cannot delete an already approved expense' }, { status: 400 });
      }
    }
    
    const expense = await Expense.findOneAndDelete({ _id: id });
    if (!expense) {
      return NextResponse.json({ message: 'Expense not found' }, { status: 404 });
    }

    // Delete related ledger entries and recalculate CASH balance
    if (expense.isApproved) {
      try {
        const LedgerTransaction = (await import('@/models/LedgerTransaction')).default;
        const { recalculateLedgerBalance } = await import('@/lib/ledgerHelper');
        
        await LedgerTransaction.deleteMany({ reference: id });
        await recalculateLedgerBalance('CASH');
      } catch (err) {
        console.error('Error updating ledger on expense delete:', err);
      }
    }
    
    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
