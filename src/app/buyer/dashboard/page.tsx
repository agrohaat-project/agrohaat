'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function BuyerDashboard() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<Record<string,unknown>[]>([]);

  useEffect(() => {
    fetch('/api/orders').then(r=>r.json()).then(d => setOrders(d.orders ?? []));
  }, []);

  const pending  = orders.filter(o => o.status === 'pending').length;
  const active   = orders.filter(o => ['accepted','paid','shipped'].includes(o.status as string)).length;
  const delivered= orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.filter(o => o.paymentStatus==='paid')
    .reduce((s,o) => s + (o.totalAmount as number), 0);

  const statusColors: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    accepted:  'bg-blue-100 text-blue-800',
    rejected:  'bg-red-100 text-red-800',
    paid:      'bg-purple-100 text-purple-800',
    shipped:   'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {session?.user.name} 👋</h1>
          <p className="text-gray-500">Track your orders and find fresh products</p>
        </div>
        <Link href="/buyer/products" className="btn-primary">🛒 Browse Products</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Orders', value: pending, icon: '⏳', color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Active Orders', value: active, icon: '📦', color: 'bg-blue-50 border-blue-200' },
          { label: 'Delivered', value: delivered, icon: '✅', color: 'bg-green-50 border-green-200' },
          { label: 'Total Spent', value: formatCurrency(totalSpent), icon: '💳', color: 'bg-purple-50 border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recent Orders</h2>
          <Link href="/buyer/orders" className="text-primary-600 text-sm hover:underline">View all →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No orders yet.</p>
            <Link href="/buyer/products" className="btn-primary text-sm">Start Shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0,5).map(order => (
              <div key={order._id as string} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex gap-3 items-center">
                  {(order.productImage as string) && (
                    <img src={order.productImage as string} className="w-10 h-10 rounded-lg object-cover" alt="" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{order.productTitle as string}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt as string)} • from {order.farmerName as string}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(order.totalAmount as number)}</p>
                  <span className={`badge text-xs ${statusColors[order.status as string] ?? 'bg-gray-100'}`}>
                    {order.status as string}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
