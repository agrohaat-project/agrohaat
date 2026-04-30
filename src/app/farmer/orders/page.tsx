'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface DeliveryJob {
  _id: string;
  status: string;
  transporterName?: string;
  farmerReadyAt?: string;
  statusUpdates?: { message: string; createdAt: string }[];
  farmerRating?: { stars: number; comment: string };
}

type Order = Record<string, unknown> & { deliveryJob?: DeliveryJob | null };

const JOB_STATUS_LABEL: Record<string, string> = {
  available:  '🔍 Finding transporter',
  accepted:   '✅ Transporter accepted',
  picked_up:  '📦 Picked up',
  in_transit: '🚛 In transit',
  delivered:  '📍 Delivered — awaiting buyer',
  confirmed:  '✅ Delivery confirmed',
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`text-2xl transition-transform hover:scale-110 ${n <= value ? 'text-yellow-400' : 'text-gray-300'}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function FarmerOrders() {
  const [orders, setOrders]           = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg]     = useState('');

  // Transporter rating modal
  const [rateModal, setRateModal]     = useState<{ orderId: string; transporterName: string } | null>(null);
  const [rateStars, setRateStars]     = useState(5);
  const [rateComment, setRateComment] = useState('');
  const [rateStatus, setRateStatus]   = useState('');

  // Existing farmer→buyer review modal
  const [reviewModal, setReviewModal] = useState<Record<string, unknown> | null>(null);
  const [reviewTimeliness, setReviewTimeliness]     = useState(5);
  const [reviewPricing, setReviewPricing]           = useState(5);
  const [reviewCommunication, setReviewCommunication] = useState(5);
  const [reviewComment, setReviewComment]           = useState('');
  const [reviewStatus, setReviewStatus]             = useState('');

  async function load() {
    setLoading(true);
    try {
      const res  = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch { setOrders([]); }
    finally  { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  async function updateOrder(id: string, action: string, extra?: Record<string, unknown>) {
    setActionLoading(id + action);
    try {
      const res  = await fetch(`/api/orders/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (res.ok) { setActionMsg('✅ Done!'); load(); }
      else         { setActionMsg(`❌ ${data.error}`); }
    } catch { setActionMsg('❌ Something went wrong'); }
    setActionLoading(null);
    setTimeout(() => setActionMsg(''), 3000);
  }

  async function submitTransporterRating() {
    if (!rateModal) return;
    setRateStatus('Submitting...');
    const res  = await fetch(`/api/orders/${rateModal.orderId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rate_transporter', stars: rateStars, comment: rateComment }),
    });
    const data = await res.json();
    if (!res.ok) { setRateStatus(data.error ?? 'Failed'); return; }
    setRateStatus('Rating submitted!');
    setTimeout(() => { setRateModal(null); setRateStatus(''); setRateStars(5); setRateComment(''); load(); }, 1500);
  }

  async function submitBuyerReview() {
    if (!reviewModal) return;
    setReviewStatus('Submitting review...');
    const res  = await fetch('/api/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toUserId: reviewModal.buyerId, orderId: reviewModal._id,
        timeliness: reviewTimeliness, pricing: reviewPricing, communication: reviewCommunication,
        comment: reviewComment,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setReviewStatus(data.error ?? 'Review failed'); return; }
    setReviewStatus('Review submitted!');
    setTimeout(() => setReviewModal(null), 1500);
  }

  const statusColors: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    accepted:  'bg-blue-100 text-blue-800',
    rejected:  'bg-red-100 text-red-800',
    paid:      'bg-purple-100 text-purple-800',
    shipped:   'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
  };

  function renderOrder(order: Order) {
    const deliveryAddress = order.deliveryAddress as Record<string, string> | undefined;
    const job = order.deliveryJob as DeliveryJob | undefined | null;

    return (
      <div key={order._id as string} className="card hover:shadow-md transition-shadow">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div className="flex gap-3">
            {(order.productImage as string) && (
              <img src={order.productImage as string} className="w-14 h-14 rounded-lg object-cover" alt="" />
            )}
            <div>
              <h3 className="font-bold">{order.productTitle as string}</h3>
              <p className="text-sm text-gray-500">
                Buyer: <strong>{order.buyerName as string}</strong> ({order.buyerPhone as string})
              </p>
              <p className="text-sm text-gray-500">
                Qty: {order.quantity as number} {order.unit as string} • {formatDate(order.createdAt as string)}
              </p>
              {typeof order.notes === 'string' && order.notes && (
                <p className="text-xs text-gray-400 mt-1">Note: {order.notes}</p>
              )}
              {deliveryAddress && (
                <p className="text-xs text-gray-400">Deliver to: {deliveryAddress.district}, {deliveryAddress.upazila}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary-600">{formatCurrency(order.totalAmount as number)}</p>
            <span className={`badge ${statusColors[order.status as string] ?? 'bg-gray-100 text-gray-600'}`}>
              {order.status as string}
            </span>
            {order.paymentStatus === 'paid' && (
              <p className="text-xs text-green-600 mt-1">✓ Paid via {order.paymentMethod as string}</p>
            )}
          </div>
        </div>

        {/* Delivery job panel — shown when order is shipped or beyond */}
        {job && (
          <div className="mt-4 pt-4 border-t border-dashed">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase">Delivery</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {JOB_STATUS_LABEL[job.status] ?? job.status}
              </span>
            </div>
            {job.transporterName && (
              <p className="text-xs text-gray-600 mb-2">🚚 Transporter: <strong>{job.transporterName}</strong></p>
            )}

            {/* Status update feed */}
            {(job.statusUpdates?.length ?? 0) > 0 && (
              <div className="space-y-1 mb-3">
                {job.statusUpdates!.slice().reverse().slice(0, 4).map((u, i) => (
                  <div key={i} className="bg-gray-50 rounded px-2 py-1 text-xs text-gray-600 flex justify-between gap-2">
                    <span>{u.message}</span>
                    <span className="text-gray-400 shrink-0">
                      {new Date(u.createdAt).toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Ready for pickup button */}
            {job.status === 'accepted' && !job.farmerReadyAt && (
              <button
                onClick={() => updateOrder(order._id as string, 'ready_for_pickup')}
                disabled={actionLoading === (order._id as string) + 'ready_for_pickup'}
                className="btn-primary text-sm w-full py-2 mb-2"
              >
                {actionLoading === (order._id as string) + 'ready_for_pickup' ? '...' : '✅ Mark as Ready for Pickup'}
              </button>
            )}
            {job.status === 'accepted' && job.farmerReadyAt && (
              <div className="bg-green-50 text-green-700 text-xs rounded p-2 mb-2">
                ✅ Marked ready for pickup — waiting for transporter to collect
              </div>
            )}

            {/* Rate transporter after confirmed */}
            {job.status === 'confirmed' && !job.farmerRating && (
              <button
                onClick={() => setRateModal({ orderId: order._id as string, transporterName: job.transporterName ?? 'Transporter' })}
                className="btn-secondary text-sm w-full py-2"
              >
                ⭐ Rate Transporter
              </button>
            )}
            {job.status === 'confirmed' && job.farmerRating && (
              <div className="text-xs text-gray-500">
                You rated: {'⭐'.repeat(job.farmerRating.stars)} {job.farmerRating.comment && `— "${job.farmerRating.comment}"`}
              </div>
            )}
          </div>
        )}

        {/* Order actions */}
        {order.status === 'pending' && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button onClick={() => updateOrder(order._id as string, 'accept')} className="btn-primary text-sm flex-1">
              ✓ Accept Order
            </button>
            <button onClick={() => {
              const reason = prompt('Reason for rejection (optional):') ?? '';
              updateOrder(order._id as string, 'reject', { rejectionReason: reason });
            }} className="btn-danger text-sm flex-1">
              ✗ Reject
            </button>
          </div>
        )}
        {order.status === 'paid' && (
          <div className="mt-4 pt-4 border-t">
            <button onClick={() => updateOrder(order._id as string, 'ship')} className="btn-primary text-sm">
              📦 Mark as Shipped
            </button>
            <p className="text-xs text-gray-500 mt-1">A delivery job will be created for transporters.</p>
          </div>
        )}
        {order.status === 'delivered' && !job && (
          <div className="mt-4 pt-4 border-t">
            <button onClick={() => setReviewModal({
              _id: order._id, buyerId: order.buyerId, buyerName: order.buyerName, productTitle: order.productTitle,
            })} className="btn-secondary text-sm">⭐ Rate Buyer</button>
          </div>
        )}
        {order.status === 'delivered' && job?.status === 'confirmed' && (
          <div className="mt-4 pt-4 border-t">
            <button onClick={() => setReviewModal({
              _id: order._id, buyerId: order.buyerId, buyerName: order.buyerName, productTitle: order.productTitle,
            })} className="btn-secondary text-sm">⭐ Rate Buyer</button>
          </div>
        )}
        {order.status === 'rejected' && typeof order.rejectionReason === 'string' && order.rejectionReason && (
          <p className="text-sm text-red-600 mt-2 pt-2 border-t">Reason: {order.rejectionReason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Orders</h1>

      {actionMsg && (
        <div className={`p-3 rounded-lg text-sm ${actionMsg.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {actionMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'accepted', 'paid', 'shipped', 'delivered', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No orders found.</div>
      ) : (
        <div className="space-y-4">{filtered.map(renderOrder)}</div>
      )}

      {/* Rate Transporter Modal */}
      {rateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Rate Transporter</h2>
                <p className="text-sm text-gray-500">{rateModal.transporterName}</p>
              </div>
              <button onClick={() => setRateModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Stars</label>
                <StarPicker value={rateStars} onChange={setRateStars} />
              </div>
              <div>
                <label className="label">Comment (optional)</label>
                <textarea rows={3} className="input w-full resize-none"
                  value={rateComment} onChange={e => setRateComment(e.target.value)}
                  placeholder="How was the delivery service?" />
              </div>
              {rateStatus && <p className="text-sm text-gray-600">{rateStatus}</p>}
              <div className="flex gap-3">
                <button onClick={submitTransporterRating} className="btn-primary flex-1 py-3">Submit Rating</button>
                <button onClick={() => setRateModal(null)} className="btn-secondary px-4">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Buyer Modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Rate Buyer</h2>
                <p className="text-sm text-gray-500">Share your feedback after delivering the order.</p>
              </div>
              <button onClick={() => setReviewModal(null)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div><label className="label">Buyer</label>
                <input value={reviewModal.buyerName as string} disabled className="input bg-gray-100" /></div>
              <div><label className="label">Timeliness</label>
                <select className="input" value={reviewTimeliness} onChange={e => setReviewTimeliness(Number(e.target.value))}>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} star{v>1?'s':''}</option>)}
                </select></div>
              <div><label className="label">Pricing & Fairness</label>
                <select className="input" value={reviewPricing} onChange={e => setReviewPricing(Number(e.target.value))}>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} star{v>1?'s':''}</option>)}
                </select></div>
              <div><label className="label">Communication</label>
                <select className="input" value={reviewCommunication} onChange={e => setReviewCommunication(Number(e.target.value))}>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} star{v>1?'s':''}</option>)}
                </select></div>
              <div><label className="label">Comment</label>
                <textarea rows={3} className="input w-full resize-none" value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)} placeholder="Write a short review." /></div>
              {reviewStatus && <p className="text-sm text-gray-600">{reviewStatus}</p>}
              <div className="flex gap-3">
                <button onClick={submitBuyerReview} className="btn-primary flex-1 py-3">Submit Review</button>
                <button onClick={() => setReviewModal(null)} className="btn-secondary px-4">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
