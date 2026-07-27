/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import Product from '@/models/Product';
import Expense from '@/models/Expense';
import Showroom from '@/models/Showroom';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const userRole = (session?.user as any)?.role;
    if (!session || !(['admin', 'super_admin', 'manager', 'showroom_manager'].includes(userRole))) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Default range: Last 30 days
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const defaultTo = new Date();

    let startDate = defaultFrom;
    if (from) {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        startDate = new Date(Date.UTC(parsedFrom.getUTCFullYear(), parsedFrom.getUTCMonth(), parsedFrom.getUTCDate()));
      }
    } else {
      startDate = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate() - 30));
    }

    let endDate = defaultTo;
    if (to) {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        endDate = new Date(Date.UTC(parsedTo.getUTCFullYear(), parsedTo.getUTCMonth(), parsedTo.getUTCDate(), 23, 59, 59, 999));
      }
    } else {
      endDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate(), 23, 59, 59, 999));
    }

    await connectToDatabase();

    // 1 & 2. Total Revenue, COGS, and Sales Count (Delivered Orders)
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalDeliveryCharge: { $sum: '$deliveryCharge' },
          salesCount: { $sum: 1 },
          totalCOGS: {
            $sum: {
              $sum: {
                $map: {
                  input: '$items',
                  as: 'item',
                  in: { $multiply: ['$$item.quantity', { $ifNull: ['$$item.purchasePrice', 0] }] }
                }
              }
            }
          }
        }
      }
    ]);

    const {
      totalRevenue = 0,
      totalDeliveryCharge = 0,
      salesCount = 0,
      totalCOGS = 0
    } = revenueStats[0] || {};

    // 3. Expenses & Incomes
    const expenseStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: { $ne: 'income' },
          status: 'Approved'
        }
      },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);
    const totalExpenses = expenseStats[0]?.totalExpenses || 0;

    const incomeStats = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          type: 'income',
          status: 'Approved'
        }
      },
      {
        $group: {
          _id: null,
          totalIncomes: { $sum: '$amount' }
        }
      }
    ]);
    const totalIncomes = incomeStats[0]?.totalIncomes || 0;

    // 4. Calculations
    const grossProfit = totalRevenue - totalCOGS - totalDeliveryCharge;
    const netProfit = grossProfit + totalIncomes - totalExpenses;

    // 5. Total Customers (Only users with role 'user')
    const totalUsers = await User.countDocuments({
      role: 'user'
    });

    // 6. Pending Orders (Total, not date filtered)
    const pendingOrdersCount = await Order.countDocuments({ status: 'Order Placed', deletedAt: null });

    // 7. Recent Orders
    const recentOrders = await Order.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('slug totalAmount status createdAt')
      .populate('user', 'name email');

    // 8. Low Stock Products
    const lowStockProducts = await Product.find({ stock: { $lt: 5 } })
      .limit(5)
      .select('name stock price');

    // 9. Loyalty Stats
    const activeSubscribers = await User.countDocuments({ isSubscriptionActive: true });
    const totalWalletBalanceResult = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    const totalWalletTokens = totalWalletBalanceResult[0]?.total || 0;

    // 10. Top Selling Products
    const topSellingProducts = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // 11. Top Customers
    const topCustomers = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] }, createdAt: { $gte: startDate, $lte: endDate }, deletedAt: null } },
      {
        $group: {
          _id: '$user',
          totalSpend: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $project: {
          name: '$userData.name',
          email: '$userData.email',
          totalSpend: 1,
          orderCount: 1
        }
      }
    ]);



    // 13. New vs Returning (Sample simplified logic)
    const allUsersWithOrders = await Order.aggregate([
      {
        $match: {
          deletedAt: null,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const returningUsersCount = allUsersWithOrders.filter(u => u.count > 1).length;
    const newUsersCount = allUsersWithOrders.filter(u => u.count === 1).length;

    // 14. Chart Data & Simple Forecast
    const showrooms = await Showroom.find({}).lean();
    const showroomMap: Record<string, string> = {};
    showrooms.forEach((s: any) => {
      showroomMap[s._id.toString()] = s.name;
    });

    const ordersData = await Order.aggregate([
      {
        $match: {
          status: { $in: ['Paid', 'Confirmed', 'Ready for Delivery', 'Released for Delivery', 'Delivered'] },
          createdAt: { $gte: startDate, $lte: endDate },
          deletedAt: null
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            showroom: '$showroom'
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      }
    ]);

    const expensesIncomesData = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate },
          status: 'Approved'
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            showroom: '$showroom',
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      }
    ]);

    const mergedData: Record<string, any> = {};
    const dayMs = 24 * 60 * 60 * 1000;
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / dayMs);
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const dateStr = d.toISOString().split('T')[0];
      mergedData[dateStr] = {
        date: dateStr,
        revenue: 0,
        orders: 0,
        expense: 0,
        income: 0,
        showroomBreakdown: {}
      };
    }

    ordersData.forEach((item: any) => {
      const dateStr = item._id.date;
      if (!mergedData[dateStr]) return;
      
      const showroomId = item._id.showroom ? item._id.showroom.toString() : null;
      const showroomName = showroomId ? (showroomMap[showroomId] || 'Unknown Showroom') : 'Direct/Online';
      
      const revenue = item.revenue || 0;
      const orders = item.orders || 0;

      mergedData[dateStr].revenue += revenue;
      mergedData[dateStr].orders += orders;

      if (!mergedData[dateStr].showroomBreakdown[showroomName]) {
        mergedData[dateStr].showroomBreakdown[showroomName] = { revenue: 0, orders: 0, expense: 0, income: 0 };
      }
      mergedData[dateStr].showroomBreakdown[showroomName].revenue += revenue;
      mergedData[dateStr].showroomBreakdown[showroomName].orders += orders;
    });

    expensesIncomesData.forEach((item: any) => {
      const dateStr = item._id.date;
      if (!mergedData[dateStr]) return;

      const showroomId = item._id.showroom ? item._id.showroom.toString() : null;
      const showroomName = showroomId ? (showroomMap[showroomId] || 'Unknown Showroom') : 'Head Office';

      const amount = item.amount || 0;
      const isIncome = item._id.type === 'income';

      if (isIncome) {
        mergedData[dateStr].income += amount;
      } else {
        mergedData[dateStr].expense += amount;
      }

      if (!mergedData[dateStr].showroomBreakdown[showroomName]) {
        mergedData[dateStr].showroomBreakdown[showroomName] = { revenue: 0, orders: 0, expense: 0, income: 0 };
      }
      if (isIncome) {
        mergedData[dateStr].showroomBreakdown[showroomName].income += amount;
      } else {
        mergedData[dateStr].showroomBreakdown[showroomName].expense += amount;
      }
    });

    const chartData = Object.values(mergedData).sort((a: any, b: any) => a.date.localeCompare(b.date));



    // Calculate credit receivables
    const creditOrders = await Order.find({
      paymentMethod: 'Credit',
      paymentStatus: { $ne: 'Paid' },
      status: { $ne: 'Cancelled' },
      deletedAt: null
    }).populate('user', 'name email phone').lean() as any[];

    const totalWholesalerDue = creditOrders.reduce((sum: number, o: any) => {
      const outstanding = (o.totalAmount || 0) - (o.couponDiscountAmount || 0) - (o.walletAmountUsed || 0);
      return sum + outstanding;
    }, 0);

    const today = new Date();
    const maturedReceivableRaw = creditOrders.reduce((sum: number, o: any) => {
      if (o.expectedPaymentDate && new Date(o.expectedPaymentDate) < today) {
        const outstanding = (o.totalAmount || 0) - (o.couponDiscountAmount || 0) - (o.walletAmountUsed || 0);
        return sum + outstanding;
      }
      return sum;
    }, 0);

    // Fetch Ledger balances
    const LedgerAccount = (await import('@/models/LedgerAccount')).default;
    const ledgerAccounts = await LedgerAccount.find().lean() as any[];
    const cashAccount = ledgerAccounts.find(a => a.code === 'CASH');
    const bankAccount = ledgerAccounts.find(a => a.code === 'BANK');
    const apAccount = ledgerAccounts.find(a => a.code === 'AP');

    const cashBalance = cashAccount ? cashAccount.currentBalance : 0;
    const bankBalance = bankAccount ? bankAccount.currentBalance : 0;
    const accountReceivable = totalWholesalerDue;
    const maturedReceivable = Math.min(maturedReceivableRaw, accountReceivable);
    const supplierPayable = apAccount ? apAccount.currentBalance : 0;
    const maturedPayable = null; // Set to null as supplier due-date data is unavailable

    const wholesalerDuesMap: Record<string, any> = {};
    for (const order of creditOrders) {
      if (!order.user) continue;
      const uId = String(order.user._id);
      const outstanding = (order.totalAmount || 0) - (order.couponDiscountAmount || 0) - (order.walletAmountUsed || 0);
      if (wholesalerDuesMap[uId]) {
        wholesalerDuesMap[uId].due += outstanding;
      } else {
        wholesalerDuesMap[uId] = {
          name: order.user.name || 'Unknown Wholesaler',
          email: order.user.email,
          phone: order.user.phone,
          due: outstanding
        };
      }
    }
    const wholesalersDueList = Object.values(wholesalerDuesMap).sort((a: any, b: any) => b.due - a.due);

    return NextResponse.json({
      stats: {
        totalRevenue,
        salesCount,
        totalUsers,
        pendingOrdersCount,
        activeSubscribers,
        totalWalletTokens,
        totalCOGS,
        totalExpenses,
        grossProfit,
        netProfit,
        newUsersCount,
        returningUsersCount,
        totalWholesalerDue,
        cashBalance,
        bankBalance,
        accountReceivable,
        supplierPayable,
        maturedReceivable,
        maturedPayable
      },
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      topCustomers,
      chartData,
      wholesalersDueList
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
