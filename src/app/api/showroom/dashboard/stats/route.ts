import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import Expense from '@/models/Expense';
import Showroom from '@/models/Showroom';
import Product from '@/models/Product';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!session || userRole !== 'showroom_manager') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find the showroom managed by this user
    const showroom = await Showroom.findOne({ manager: userId }).lean() as any;
    if (!showroom) {
      return NextResponse.json({ message: 'No showroom assigned to this manager' }, { status: 404 });
    }
    const showroomId = showroom._id;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Today's orders for this showroom
    const todayOrders = await Order.find({
      showroom: showroomId,
      createdAt: { $gte: startOfToday },
      deletedAt: null,
    }).lean();

    const todaySales = todayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const todayOrderCount = todayOrders.length;

    // This month's orders
    const monthOrders = await Order.find({
      showroom: showroomId,
      createdAt: { $gte: startOfMonth },
      deletedAt: null,
    }).lean();

    const monthSales = monthOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const monthOrderCount = monthOrders.length;

    // This month's approved expenses for this showroom
    const monthExpenses = await Expense.find({
      showroom: showroomId,
      status: 'Approved',
      createdAt: { $gte: startOfMonth },
    }).lean();
    const totalMonthExpenses = monthExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

    // Showroom stock (products with stock for this showroom)
    const products = await Product.find({
      'showroomStocks.showroom': showroomId,
      isPublished: true,
    }).select('name images showroomStocks').lean() as any[];

    const stockItems = products.map((p: any) => {
      const stockEntry = p.showroomStocks?.find((s: any) => s.showroom?.toString() === showroomId.toString());
      return {
        name: p.name,
        image: p.images?.[0] || null,
        stock: stockEntry?.stock ?? 0,
      };
    }).sort((a: any, b: any) => a.stock - b.stock); // low stock first

    // Recent orders
    const recentOrders = await Order.find({ showroom: showroomId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId totalAmount status createdAt customerName')
      .lean();

    return NextResponse.json({
      showroom: { name: showroom.name, address: showroom.address },
      today: { sales: todaySales, orders: todayOrderCount },
      month: { sales: monthSales, orders: monthOrderCount, expenses: totalMonthExpenses },
      stockItems,
      recentOrders,
    });
  } catch (error: any) {
    console.error('Showroom Dashboard Stats Error:', error);
    return NextResponse.json({ message: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
