'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalUsers: number;
  pendingApproval: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentUsers: Array<{ _id: string; name: string; email: string; role: string; isApproved: boolean; createdAt: string }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const roleColor: Record<string,string> = {
    farmer: 'bg-green-100 text-green-700',
    buyer: 'bg-blue-100 text-blue-700',
    transporter: 'bg-yellow-100 text-yellow-700',
    admin: 'bg-purple-100 text-purple-700',
    specialist: 'bg-pink-100 text-pink-700',
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">⏳</div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: 'bg-blue-50 border-blue-200' },
          { label: 'Pending Approval', value: stats?.pendingApproval ?? 0, icon: '⏳', color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Products', value: stats?.totalProducts ?? 0, icon: '🌾', color: 'bg-green-50 border-green-200' },
          { label: 'Orders', value: stats?.totalOrders ?? 0, icon: '📦', color: 'bg-purple-50 border-purple-200' },
          { label: 'Revenue', value: `৳${(stats?.totalRevenue ?? 0).toLocaleString()}`, icon: '💰', color: 'bg-emerald-50 border-emerald-200' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Approvals Alert */}
      {(stats?.pendingApproval ?? 0) > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-semibold text-yellow-800">{stats?.pendingApproval} user(s) awaiting approval</div>
              <div className="text-sm text-yellow-600">Farmers and transporters need manual approval</div>
            </div>
          </div>
          <Link href="/admin/users?filter=pending" className="btn-primary text-sm py-2">
            Review Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <Link href="/admin/users" className="text-primary-600 text-sm hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {stats?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <div className="font-medium text-sm">{u.name}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                  {!u.isApproved && u.role !== 'buyer' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { href: '/admin/users?filter=pending', label: 'Approve Pending Users', icon: '✅', desc: 'Review and approve new accounts' },
              { href: '/admin/users?filter=farmer', label: 'Manage Farmers', icon: '🌾', desc: 'View and moderate farmer accounts' },
              { href: '/admin/users?filter=transporter', label: 'Manage Transporters', icon: '🚚', desc: 'View and moderate transporter accounts' },
              { href: '/admin/users', label: 'All Users', icon: '👥', desc: 'Full user management' },
            ].map(a => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 p-3 border rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <span className="text-2xl">{a.icon}</span>
                <div>
                  <div className="font-medium text-sm">{a.label}</div>
                  <div className="text-xs text-gray-500">{a.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
