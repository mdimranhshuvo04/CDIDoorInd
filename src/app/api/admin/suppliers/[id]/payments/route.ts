import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Supplier from '@/models/Supplier';
import SupplierPayment from '@/models/SupplierPayment';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !(['admin', 'super_admin', 'manager'].includes((session?.user as any)?.role))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount, paymentMethod, description, date } = body;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ message: 'Invalid payment amount' }, { status: 400 });
    }

    await connectToDatabase();

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    const payment = await SupplierPayment.create({
      supplier: id,
      amount: amountNum,
      paymentMethod,
      description,
      date: date ? new Date(date) : new Date()
    });

    // Update supplier balance (payment decreases outstanding payable balance, overpayments result in credit/negative balance)
    supplier.currentBalance = (supplier.currentBalance || 0) - amountNum;
    await supplier.save();

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error recording supplier payment:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
