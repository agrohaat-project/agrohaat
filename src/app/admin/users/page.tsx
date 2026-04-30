'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isApproved: boolean;
  isSuspended: boolean;
  isVerified: boolean;
  location?: { district?: string };
  bio?: string;
  createdAt: string;
}

const ROLES = ['all', 'farmer', 'buyer', 'transporter', 'specialist', 'admin'];

const roleColor: Record<string,string> = {
  farmer: 'bg-green-100 text-green-700',
  buyer: 'bg-blue-100 text-blue-700',
  transporter: 'bg-yellow-100 text-yellow-700',
  admin: 'bg-purple-100 text-purple-700',
  specialist: 'bg-pink-100 text-pink-700',
};

function UsersContent() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState(searchParams.get('filter') || 'all');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter !== 'all' && roleFilter !== 'pending') params.set('role', roleFilter);
    if (roleFilter === 'pending') params.set('status', 'pending');
    fetch(`/api/admin/users?${params}`)
      .then(r => r.json())
      .then(d => { setUsers(d.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAction = async (userId: string, action: string) => {
    setActionLoading(userId + action);
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ User ${action}d successfully`);
        fetchUsers();
        setSelectedUser(null);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch {
      setMessage('❌ Something went wrong');
    }
    setActionLoading(null);
    setTimeout(() => setMessage(''), 4000);
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">User Management</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {[...ROLES, 'pending'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                roleFilter === r ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading users...</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Name', 'Email', 'Role', 'Location', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {u.name}
                    </button>
                    <div className="text-xs text-gray-400">{u.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColor[u.role] || 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.location?.district || '—'}</td>
                  <td className="px-4 py-3">
                    {u.isSuspended ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Suspended</span>
                    ) : u.isApproved ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {!u.isApproved && !u.isSuspended && u.role !== 'buyer' && (
                        <button
                          onClick={() => handleAction(u._id, 'approve')}
                          disabled={!!actionLoading}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50"
                        >
                          {actionLoading === u._id + 'approve' ? '...' : 'Approve'}
                        </button>
                      )}
                      {!u.isSuspended && u.role !== 'admin' && (
                        <button
                          onClick={() => handleAction(u._id, 'suspend')}
                          disabled={!!actionLoading}
                          className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                        >
                          {actionLoading === u._id + 'suspend' ? '...' : 'Suspend'}
                        </button>
                      )}
                      {u.isSuspended && (
                        <button
                          onClick={() => handleAction(u._id, 'reinstate')}
                          disabled={!!actionLoading}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          {actionLoading === u._id + 'reinstate' ? '...' : 'Reinstate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email:</span><span>{selectedUser.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone:</span><span>{selectedUser.phone}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Role:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleColor[selectedUser.role]}`}>{selectedUser.role}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">District:</span><span>{selectedUser.location?.district || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${selectedUser.isSuspended ? 'bg-red-100 text-red-700' : selectedUser.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {selectedUser.isSuspended ? 'Suspended' : selectedUser.isApproved ? 'Active' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between"><span className="text-gray-500">Joined:</span><span>{new Date(selectedUser.createdAt).toLocaleDateString('en-BD')}</span></div>
                {selectedUser.bio && <div><span className="text-gray-500">Bio:</span><p className="text-gray-700 mt-1">{selectedUser.bio}</p></div>}
              </div>
              <div className="flex gap-2 mt-5 pt-4 border-t">
                {!selectedUser.isApproved && !selectedUser.isSuspended && selectedUser.role !== 'buyer' && (
                  <button onClick={() => handleAction(selectedUser._id, 'approve')} className="btn-primary flex-1 text-sm py-2">
                    ✅ Approve
                  </button>
                )}
                {!selectedUser.isSuspended && selectedUser.role !== 'admin' && (
                  <button onClick={() => handleAction(selectedUser._id, 'suspend')} className="btn-danger flex-1 text-sm py-2">
                    🚫 Suspend
                  </button>
                )}
                {selectedUser.isSuspended && (
                  <button onClick={() => handleAction(selectedUser._id, 'reinstate')} className="btn-secondary flex-1 text-sm py-2">
                    ✅ Reinstate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <UsersContent />
    </Suspense>
  );
}
