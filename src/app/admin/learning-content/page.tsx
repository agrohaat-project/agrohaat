'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';

interface ContentItem {
  _id: string;
  title: string;
  description: string;
  type: 'video' | 'infographic' | 'guide' | 'tip';
  category: string;
  youtubeId?: string;
  imageUrl?: string;
  content?: string;
  tags: string[];
  difficulty: string;
  authorName: string;
  authorRole: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  flagCount: number;
  flags: Array<{ userId: string; reason: string; createdAt: string }>;
  createdAt: string;
}

const typeConfig: Record<string, { icon: string; bg: string }> = {
  video:       { icon: '▶️',  bg: 'bg-red-50 text-red-700 border-red-200' },
  infographic: { icon: '📊',  bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  guide:       { icon: '📖',  bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  tip:         { icon: '💡',  bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const statusConfig: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const roleConfig: Record<string, string> = {
  admin:      'bg-purple-100 text-purple-800',
  specialist: 'bg-blue-100 text-blue-800',
  farmer:     'bg-green-100 text-green-800',
};

export default function AdminLearningContentPage() {
  const { data: session } = useSession();
  const [items, setItems]           = useState<ContentItem[]>([]);
  const [filter, setFilter]         = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded]     = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [toast, setToast]           = useState('');

  useEffect(() => { loadItems(); }, [filter]);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await fetch(`/api/learning-content?admin=true&status=${filter}`);
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleReview(id: string, action: 'approve' | 'reject', reason?: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/learning-content/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const data = await res.json();
      if (!res.ok) { showToast('Error: ' + data.error); return; }
      showToast(data.message);
      setRejectTarget(null);
      setRejectReason('');
      loadItems();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this content permanently?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/learning-content/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast('Error: ' + data.error); return; }
      showToast('Content deleted.');
      loadItems();
    } finally {
      setActionLoading(null);
    }
  }

  const counts = {
    pending:  items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm font-medium px-5 py-3 rounded-2xl shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Content Review</h1>
          <p className="text-gray-500 mt-1">Review, approve, or reject content submitted by farmers and specialists.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="rounded-2xl bg-yellow-50 border border-yellow-200 px-4 py-2 text-center">
            <div className="text-xl font-bold text-yellow-800">{counts.pending}</div>
            <div className="text-xs text-yellow-600 font-medium">Pending</div>
          </div>
          <div className="rounded-2xl bg-green-50 border border-green-200 px-4 py-2 text-center">
            <div className="text-xl font-bold text-green-800">{counts.approved}</div>
            <div className="text-xs text-green-600 font-medium">Approved</div>
          </div>
          <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-2 text-center">
            <div className="text-xl font-bold text-red-800">{counts.rejected}</div>
            <div className="text-xs text-red-600 font-medium">Rejected</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filter === f ? 'bg-green-600 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === 'pending' && counts.pending > 0 && (
              <span className="ml-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content List */}
      {loading ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No content in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(item => {
            const tc = typeConfig[item.type];
            const isExpanded = expanded === item._id;
            const isActioning = actionLoading === item._id;

            return (
              <div key={item._id} className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail / Type Icon */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl border flex items-center justify-center text-2xl ${tc.bg}`}>
                      {item.youtubeId ? (
                        <img src={`https://img.youtube.com/vi/${item.youtubeId}/default.jpg`} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
                      ) : tc.icon}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${tc.bg}`}>{tc.icon} {item.type}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusConfig[item.status]}`}>{item.status}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleConfig[item.authorRole] || 'bg-gray-100 text-gray-700'}`}>
                          {item.authorRole === 'farmer' ? '🌾' : item.authorRole === 'specialist' ? '🔬' : '👑'} {item.authorName}
                        </span>
                        {item.flagCount > 0 && (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-100 text-red-800">🚩 {item.flagCount} flag{item.flagCount > 1 ? 's' : ''}</span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-900 text-base leading-snug">{item.title}</h3>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>•</span>
                        <span className="capitalize">{item.category.replace('-', ' ')}</span>
                        <span>•</span>
                        <span>{item.difficulty}</span>
                        {item.tags.length > 0 && <span>• {item.tags.slice(0, 2).join(', ')}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {item.status === 'pending' && (
                        <>
                          <button onClick={() => handleReview(item._id, 'approve')} disabled={isActioning}
                            className="btn-primary text-xs py-2 px-4 disabled:opacity-60">
                            {isActioning ? '...' : '✅ Approve'}
                          </button>
                          <button onClick={() => setRejectTarget(item._id)} disabled={isActioning}
                            className="btn-danger text-xs py-2 px-4 disabled:opacity-60">
                            ❌ Reject
                          </button>
                        </>
                      )}
                      {item.status === 'approved' && (
                        <button onClick={() => handleReview(item._id, 'reject', 'Removed by admin')} disabled={isActioning}
                          className="btn-secondary text-xs py-2 px-3 disabled:opacity-60">
                          Unpublish
                        </button>
                      )}
                      {item.status === 'rejected' && (
                        <button onClick={() => handleReview(item._id, 'approve')} disabled={isActioning}
                          className="btn-secondary text-xs py-2 px-3 disabled:opacity-60">
                          Re-approve
                        </button>
                      )}
                      <button onClick={() => handleDelete(item._id)} disabled={isActioning}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold py-1 transition">
                        🗑 Delete
                      </button>
                      <button onClick={() => setExpanded(isExpanded ? null : item._id)}
                        className="text-xs text-gray-400 hover:text-gray-600 font-semibold py-1 transition">
                        {isExpanded ? 'Less ▲' : 'More ▼'}
                      </button>
                    </div>
                  </div>

                  {/* Reject Reason Input */}
                  {rejectTarget === item._id && (
                    <div className="mt-4 p-4 bg-red-50 rounded-2xl border border-red-200 space-y-3">
                      <label className="label text-red-800">Rejection Reason (optional)</label>
                      <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="E.g. Inaccurate information, low quality..." className="input text-sm" />
                      <div className="flex gap-2">
                        <button onClick={() => handleReview(item._id, 'reject', rejectReason)} className="btn-danger text-sm py-2">Confirm Reject</button>
                        <button onClick={() => setRejectTarget(null)} className="btn-secondary text-sm py-2">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 space-y-4">
                    {item.content && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Content</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.content}</p>
                      </div>
                    )}
                    {item.youtubeId && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">YouTube ID</p>
                        <a href={`https://youtube.com/watch?v=${item.youtubeId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          https://youtube.com/watch?v={item.youtubeId}
                        </a>
                      </div>
                    )}
                    {item.imageUrl && (
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Infographic</p>
                        <img src={item.imageUrl} alt="Infographic" className="max-h-48 rounded-2xl border border-gray-200 object-contain" />
                      </div>
                    )}
                    {item.rejectionReason && (
                      <div className="bg-red-50 rounded-2xl p-3 border border-red-200">
                        <p className="text-xs font-bold text-red-700 mb-1">Rejection Reason</p>
                        <p className="text-sm text-red-600">{item.rejectionReason}</p>
                      </div>
                    )}
                    {item.flagCount > 0 && (
                      <div className="bg-orange-50 rounded-2xl p-3 border border-orange-200">
                        <p className="text-xs font-bold text-orange-700 mb-2">🚩 Flag Reports ({item.flagCount})</p>
                        <div className="space-y-1">
                          {item.flags.map((f, i) => (
                            <div key={i} className="text-xs text-orange-600">— {f.reason}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
