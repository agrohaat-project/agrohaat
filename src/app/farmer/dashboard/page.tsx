'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface Stats { products: number; pendingOrders: number; acceptedOrders: number; revenue: number }

export default function FarmerDashboard() {
  const { data: session } = useSession();
  const [stats, setStats]     = useState<Stats | null>(null);
  const [recentOrders, setRO] = useState<Record<string,unknown>[]>([]);

  useEffect(() => {
    async function load() {
      const [pRes, oRes] = await Promise.all([
        fetch('/api/products?farmerId=' + session?.user.id),
        fetch('/api/orders'),
      ]);
      const [pData, oData] = await Promise.all([pRes.json(), oRes.json()]);
      const orders: Record<string,unknown>[] = oData.orders ?? [];
      const pending  = orders.filter((o: Record<string,unknown>) => o.status === 'pending').length;
      const accepted = orders.filter((o: Record<string,unknown>) => o.status === 'accepted').length;
      const revenue  = orders
        .filter((o: Record<string,unknown>) => o.paymentStatus === 'paid')
        .reduce((s: number, o: Record<string,unknown>) => s + (o.totalAmount as number), 0);
      setStats({ products: pData.total ?? 0, pendingOrders: pending, acceptedOrders: accepted, revenue });
      setRO(orders.slice(0, 5));
    }
    if (session) load();
  }, [session]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {session?.user.name} 👋</h1>
          <p className="text-gray-500">Here's your farm dashboard</p>
        </div>
        <Link href="/farmer/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Listed Products', value: stats?.products ?? '...', icon: '🌾', color: 'bg-green-50 border-green-200' },
          { label: 'Pending Orders', value: stats?.pendingOrders ?? '...', icon: '⏳', color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Active Orders', value: stats?.acceptedOrders ?? '...', icon: '✅', color: 'bg-blue-50 border-blue-200' },
          { label: 'Total Revenue', value: stats ? formatCurrency(stats.revenue) : '...', icon: '💰', color: 'bg-purple-50 border-purple-200' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recent Orders</h2>
          <Link href="/farmer/orders" className="text-primary-600 text-sm hover:underline">View all →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order: Record<string,unknown>) => (
              <div key={order._id as string} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{order.productTitle as string}</p>
                  <p className="text-xs text-gray-500">Buyer: {order.buyerName as string} • {order.quantity as number} {order.unit as string}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(order.totalAmount as number)}</p>
                  <span className={`badge text-xs ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'paid' ? 'bg-purple-100 text-purple-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>{order.status as string}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
