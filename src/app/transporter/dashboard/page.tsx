'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Job {
  _id: string;
  status: string;
  pickupLocation: { district: string; upazila?: string };
  deliveryLocation: { district: string; upazila?: string };
  deliveryFee: number;
  productWeight: number;
  productTitle?: string;
  farmerName?: string;
  buyerName?: string;
  createdAt: string;
  confirmedAt?: string;
  farmerReadyAt?: string;
  statusUpdates?: { message: string; createdAt: string }[];
  farmerRating?: { stars: number; comment: string };
  buyerRating?: { stars: number; comment: string };
}

const STATUS_COLOR: Record<string, string> = {
  available:  'bg-blue-100 text-blue-700',
  accepted:   'bg-yellow-100 text-yellow-700',
  picked_up:  'bg-indigo-100 text-indigo-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered:  'bg-teal-100 text-teal-700',
  confirmed:  'bg-green-100 text-green-700',
};

const STATUS_LABEL: Record<string, string> = {
  accepted:'ACCEPTED', picked_up:'PICKED UP', in_transit:'IN TRANSIT',
  delivered:'DELIVERED', confirmed:'CONFIRMED',
};

function Stars({ n }: { n: number }) {
  return <span>{Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < n ? 'text-yellow-400' : 'text-gray-200'}>★</span>
  ))}</span>;
}

export default function TransporterDashboard() {
  const { data: session } = useSession();
  const [jobs, setJobs]   = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/delivery-jobs?filter=mine')
      .then(r => r.json())
      .then(d => { setJobs(d.jobs || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Derive stats
  const activeJob  = jobs.find(j => ['accepted','picked_up','in_transit'].includes(j.status));
  const confirmed  = jobs.filter(j => j.status === 'confirmed');
  const pending    = jobs.filter(j => j.status === 'delivered');   // delivered but not yet confirmed

  const totalEarned   = confirmed.reduce((s, j) => s + j.deliveryFee, 0);
  const pendingEarned = pending.reduce((s, j) => s + j.deliveryFee, 0);

  // Average rating from farmer + buyer ratings across all confirmed jobs
  const allRatings: number[] = [];
  confirmed.forEach(j => {
    if (j.farmerRating) allRatings.push(j.farmerRating.stars);
    if (j.buyerRating)  allRatings.push(j.buyerRating.stars);
  });
  const avgRating = allRatings.length
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  const recentHistory = confirmed
    .slice()
    .sort((a, b) => new Date(b.confirmedAt ?? b.createdAt).getTime() - new Date(a.confirmedAt ?? a.createdAt).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {session?.user?.name} 🚚</h1>
        <p className="text-gray-500 text-sm mt-1">Your delivery overview</p>
      </div>

      {/* ── Active job pinned ─────────────────────────────────────────────── */}
      {!loading && activeJob && (
        <div className="card border-2 border-primary-400 bg-primary-50">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-primary-700 text-sm">🔴 Active Job</span>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLOR[activeJob.status]}`}>
              {STATUS_LABEL[activeJob.status] ?? activeJob.status.toUpperCase()}
            </span>
          </div>
          {activeJob.productTitle && <p className="text-xs text-gray-500 mb-2">📦 {activeJob.productTitle}</p>}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 bg-white rounded p-2 text-center shadow-sm">
              <div className="text-xs text-gray-400">Pickup</div>
              <div className="font-semibold text-sm">{activeJob.pickupLocation.district}</div>
              {activeJob.pickupLocation.upazila && <div className="text-xs text-gray-500">{activeJob.pickupLocation.upazila}</div>}
            </div>
            <div className="text-gray-400 text-xl">→</div>
            <div className="flex-1 bg-white rounded p-2 text-center shadow-sm">
              <div className="text-xs text-gray-400">Delivery</div>
              <div className="font-semibold text-sm">{activeJob.deliveryLocation.district}</div>
              {activeJob.deliveryLocation.upazila && <div className="text-xs text-gray-500">{activeJob.deliveryLocation.upazila}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
            <div>⚖️ {activeJob.productWeight} kg</div>
            <div className="text-right font-bold text-primary-600">৳{activeJob.deliveryFee}</div>
            {activeJob.farmerName && <div>🌾 {activeJob.farmerName}</div>}
            {activeJob.buyerName  && <div>🛒 {activeJob.buyerName}</div>}
          </div>
          {activeJob.status === 'accepted' && activeJob.farmerReadyAt && (
            <div className="bg-green-100 text-green-700 rounded p-2 text-xs mb-2">
              ✅ Farmer ready since {new Date(activeJob.farmerReadyAt).toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit' })}
            </div>
          )}
          {(activeJob.statusUpdates?.length ?? 0) > 0 && (
            <div className="bg-white rounded p-2 text-xs text-gray-600 mb-2">
              <p className="text-gray-400 mb-1">Latest update</p>
              {activeJob.statusUpdates![activeJob.statusUpdates!.length - 1].message}
            </div>
          )}
          <Link href="/transporter/jobs" className="btn-primary w-full text-center block text-sm py-2">
            Manage This Job →
          </Link>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earned',     value: `৳${totalEarned.toLocaleString()}`,  color: 'bg-green-50 border-green-200',  icon: '💰' },
          { label: 'Pending Payment',  value: `৳${pendingEarned.toLocaleString()}`, color: 'bg-teal-50 border-teal-200',    icon: '⏳' },
          { label: 'Jobs Completed',   value: confirmed.length,                      color: 'bg-blue-50 border-blue-200',    icon: '✅' },
          { label: 'Avg Rating',       value: avgRating ? `${avgRating} ★` : '—',   color: 'bg-yellow-50 border-yellow-200', icon: '⭐' },
        ].map(s => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Browse available + quick links ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Quick Links</h2>
          </div>
          <div className="space-y-2">
            <Link href="/transporter/jobs?tab=available" className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">📋 Browse Available Jobs</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link href="/transporter/jobs?tab=in_transit" className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">🚛 Active Deliveries</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
            <Link href="/transporter/jobs?tab=confirmed" className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium">✅ Completed Jobs</span>
              <span className="text-xs text-gray-400">→</span>
            </Link>
          </div>
        </div>

        {/* Earnings summary */}
        <div className="card bg-gradient-to-r from-primary-50 to-green-50 border border-primary-100">
          <h2 className="text-lg font-semibold mb-3">Earnings Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Confirmed earnings</span>
              <span className="font-bold text-green-600">৳{totalEarned.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending (awaiting buyer)</span>
              <span className="font-bold text-teal-600">৳{pendingEarned.toLocaleString()}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-semibold">Total pipeline</span>
              <span className="font-bold text-primary-600">৳{(totalEarned + pendingEarned).toLocaleString()}</span>
            </div>
            {confirmed.length > 0 && (
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Avg per job</span>
                <span>৳{Math.round(totalEarned / confirmed.length).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Completed deliveries history ──────────────────────────────────── */}
      {!loading && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Completed Deliveries</h2>
            <span className="text-sm text-gray-400">{confirmed.length} total</span>
          </div>

          {recentHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📦</div>
              <p className="text-sm">No completed deliveries yet</p>
              <Link href="/transporter/jobs" className="text-primary-600 text-sm hover:underline mt-1 block">Find your first job →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentHistory.map(job => {
                const avgJobRating = [job.farmerRating?.stars, job.buyerRating?.stars].filter(Boolean) as number[];
                const rating = avgJobRating.length ? avgJobRating.reduce((a, b) => a + b, 0) / avgJobRating.length : null;
                return (
                  <div key={job._id} className="flex items-start justify-between py-3 border-b last:border-0 gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.productTitle ?? 'Delivery'}</p>
                      <p className="text-xs text-gray-500">
                        {job.pickupLocation.district} → {job.deliveryLocation.district}
                        {' • '}{job.productWeight} kg
                      </p>
                      {job.confirmedAt && (
                        <p className="text-xs text-gray-400">{new Date(job.confirmedAt).toLocaleDateString('en-BD')}</p>
                      )}
                      {rating !== null && (
                        <div className="mt-1"><Stars n={Math.round(rating)} /></div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-green-600">৳{job.deliveryFee}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Paid</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
