import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Expense from '@/models/Expense';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    const body = await req.json();
    const { title, amount, category, date, description, type } = body;
    
    // Sanitize update data (whitelist)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (amount !== undefined) updateData.amount = amount;
    if (category !== undefined) updateData.category = category;
    if (date !== undefined) updateData.date = date;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;

    await connectToDatabase();
    
    const dbSession = await mongoose.startSession();
    try {
      dbSession.startTransaction();

      const expense = await Expense.findOneAndUpdate(
        { _id: id }, 
        updateData, 
        { new: true, runValidators: true, session: dbSession }
      );

      if (!expense) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return NextResponse.json({ message: 'Record not found' }, { status: 404 });
      }

      // Update ledger entry if amount, title or type changed
      const LedgerTransaction = (await import('@/models/LedgerTransaction')).default;
      const { recalculateLedgerBalance, logLedgerTransaction } = await import('@/lib/ledgerHelper');
      
      // Delete old ledger entries for this reference
      await LedgerTransaction.deleteMany({ reference: id }).session(dbSession);

      // Log the updated expense/income
      if (expense.type === 'expense') {
        await logLedgerTransaction(
          'CASH',
          'credit',
          expense.amount,
          `Expense Paid: ${expense.title}`,
          expense._id.toString(),
          expense.date ? new Date(expense.date) : new Date()
        );
      } else {
        await logLedgerTransaction(
          'CASH',
          'debit',
          expense.amount,
          `Income Received: ${expense.title}`,
          expense._id.toString(),
          expense.date ? new Date(expense.date) : new Date()
        );
      }
      // Recalculate Cash balance
      await recalculateLedgerBalance('CASH');

      await dbSession.commitTransaction();
      dbSession.endSession();
      return NextResponse.json(expense);
    } catch (err: any) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      console.error('Error updating ledger on transaction update:', err);
      return NextResponse.json({ message: 'Ledger sync failed on update', error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error updating transaction:', error);
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
    if (!session || !(['admin', 'super_admin'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    const dbSession = await mongoose.startSession();
    try {
      dbSession.startTransaction();

      const expense = await Expense.findOneAndDelete({ _id: id }).session(dbSession);
      if (!expense) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return NextResponse.json({ message: 'Record not found' }, { status: 404 });
      }

      // Delete related ledger entries and recalculate CASH balance
      const LedgerTransaction = (await import('@/models/LedgerTransaction')).default;
      const { recalculateLedgerBalance } = await import('@/lib/ledgerHelper');
      
      await LedgerTransaction.deleteMany({ reference: id }).session(dbSession);
      await recalculateLedgerBalance('CASH');

      await dbSession.commitTransaction();
      dbSession.endSession();
      return NextResponse.json({ message: 'Transaction deleted successfully' });
    } catch (err: any) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      console.error('Error updating ledger on transaction delete:', err);
      return NextResponse.json({ message: 'Ledger sync failed on delete', error: err.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
