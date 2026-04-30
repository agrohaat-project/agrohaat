'use client';
import { useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface StatusUpdate { message: string; createdAt: string }

interface Job {
  _id: string;
  status: string;
  pickupLocation: { district: string; upazila?: string; address?: string };
  deliveryLocation: { district: string; upazila?: string; address?: string };
  deliveryFee: number;
  productWeight: number;
  productTitle?: string;
  createdAt: string;
  farmerName?: string;
  buyerName?: string;
  farmerReadyAt?: string;
  pickedUpAt?: string;
  inTransitAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  statusUpdates?: StatusUpdate[];
  farmerRating?: { stars: number; comment: string };
  buyerRating?: { stars: number; comment: string };
}

// ── Map helpers ───────────────────────────────────────────────────────────────

interface Coords { lat: number; lng: number }
interface DistanceInfo { straight: number; road?: string; duration?: string }

const DISTRICT_COORDS: Record<string, Coords> = {
  Dhaka:{ lat:23.8103,lng:90.4125 }, Chittagong:{ lat:22.3569,lng:91.7832 },
  Rajshahi:{ lat:24.3745,lng:88.6042 }, Khulna:{ lat:22.8456,lng:89.5403 },
  Sylhet:{ lat:24.8949,lng:91.8687 }, Barisal:{ lat:22.7010,lng:90.3535 },
  Rangpur:{ lat:25.7439,lng:89.2752 }, Mymensingh:{ lat:24.7471,lng:90.4203 },
  Cumilla:{ lat:23.4607,lng:91.1809 }, Narayanganj:{ lat:23.6238,lng:90.5000 },
  Gazipur:{ lat:23.9999,lng:90.4203 }, Bogura:{ lat:24.8466,lng:89.3773 },
  Jessore:{ lat:23.1664,lng:89.2182 }, Jashore:{ lat:23.1664,lng:89.2182 },
  Dinajpur:{ lat:25.6279,lng:88.6338 }, Tangail:{ lat:24.2511,lng:89.9167 },
  Faridpur:{ lat:23.6070,lng:89.8429 }, Pabna:{ lat:24.0064,lng:89.2372 },
  Sirajganj:{ lat:24.4534,lng:89.7006 }, Naogaon:{ lat:24.9132,lng:88.7502 },
  Habiganj:{ lat:24.3745,lng:91.4154 }, Moulvibazar:{ lat:24.4829,lng:91.7779 },
  Sunamganj:{ lat:25.0658,lng:91.3951 }, Netrokona:{ lat:24.8700,lng:90.7260 },
  Jamalpur:{ lat:24.9375,lng:89.9376 }, Sherpur:{ lat:25.0197,lng:90.0149 },
  Kishoreganj:{ lat:24.4449,lng:90.7766 }, Narsingdi:{ lat:23.9219,lng:90.7149 },
  Munshiganj:{ lat:23.5422,lng:90.5303 }, Manikganj:{ lat:23.8624,lng:89.9695 },
};

function haversineKm(a: Coords, b: Coords): number {
  const R = 6371, dLat = (b.lat-a.lat)*Math.PI/180, dLng = (b.lng-a.lng)*Math.PI/180;
  const h = Math.sin(dLat/2)**2 + Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h)));
}

function JobMap({ pickup, delivery }: { pickup: Job['pickupLocation']; delivery: Job['deliveryLocation'] }) {
  const { isLoaded } = useJsApiLoader({ id:'google-map-script', googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY??'' });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [pickupCoords, setPickupCoords] = useState<Coords | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<Coords | null>(null);
  const [distanceInfo, setDistanceInfo] = useState<DistanceInfo | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    setLocating(true);
    const geocoder = new google.maps.Geocoder();
    const geocode = (loc: Job['pickupLocation']): Promise<Coords> => {
      const queries = [[loc.upazila, loc.district, 'Bangladesh'].filter(Boolean).join(', '), `${loc.district} District, Bangladesh`];
      const tryQ = (i: number): Promise<Coords> => new Promise((res, rej) =>
        geocoder.geocode({ address: queries[i] }, (results, status) => {
          if (status === 'OK' && results?.[0]) { const { lat, lng } = results[0].geometry.location; res({ lat: lat(), lng: lng() }); }
          else if (i+1 < queries.length) tryQ(i+1).then(res).catch(rej);
          else { const fb = DISTRICT_COORDS[loc.district]; fb ? res(fb) : rej(new Error(`Cannot locate "${loc.district}"`)); }
        })
      );
      return tryQ(0);
    };
    Promise.all([geocode(pickup), geocode(delivery)]).then(([p, d]) => {
      setPickupCoords(p); setDeliveryCoords(d); setLocating(false);
      const straight = haversineKm(p, d);
      new google.maps.DistanceMatrixService().getDistanceMatrix(
        { origins:[new google.maps.LatLng(p.lat,p.lng)], destinations:[new google.maps.LatLng(d.lat,d.lng)], travelMode:google.maps.TravelMode.DRIVING },
        (result, status) => {
          const el = result?.rows?.[0]?.elements?.[0];
          if (status==='OK' && el?.status==='OK') setDistanceInfo({ straight, road:el.distance.text, duration:el.duration.text });
          else setDistanceInfo({ straight });
        }
      );
    }).catch(e => { setError((e as Error).message); setLocating(false); });
  }, [isLoaded, pickup.district, delivery.district]);

  useEffect(() => {
    if (mapRef.current && pickupCoords && deliveryCoords) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(pickupCoords); bounds.extend(deliveryCoords);
      mapRef.current.fitBounds(bounds, 40);
    }
  }, [pickupCoords, deliveryCoords]);

  if (!isLoaded || locating) return <div className="py-4 text-center text-sm text-gray-400">🗺 Loading map...</div>;
  if (error) return <div className="py-2 text-xs text-red-500">⚠️ {error}</div>;
  if (!pickupCoords || !deliveryCoords) return null;

  return (
    <div className="mt-3 space-y-2">
      <GoogleMap mapContainerStyle={{ width:'100%', height:'200px', borderRadius:'8px', overflow:'hidden' }}
        center={pickupCoords} zoom={7} onLoad={m => { mapRef.current = m; }}
        options={{ gestureHandling:'cooperative', fullscreenControl:false, streetViewControl:false, mapTypeControl:false }}>
        <Marker position={pickupCoords} title={`Pickup: ${pickup.district}`} icon={{ url:'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }} />
        <Marker position={deliveryCoords} title={`Delivery: ${delivery.district}`} icon={{ url:'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }} />
      </GoogleMap>
      <div className="flex gap-4 text-xs px-1 text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Pickup: {pickup.district}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Delivery: {delivery.district}</span>
      </div>
      {distanceInfo && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-800">
          📍 Straight-line: <strong>{distanceInfo.straight} km</strong>
          {distanceInfo.road && <> — 🚛 Road: <strong>{distanceInfo.road}</strong> — ⏱ <strong>{distanceInfo.duration}</strong></>}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const STATUS_TABS = ['all', 'available', 'accepted', 'picked_up', 'in_transit', 'delivered', 'confirmed'];

const STATUS_COLOR: Record<string, string> = {
  available:  'bg-blue-100 text-blue-700',
  accepted:   'bg-yellow-100 text-yellow-700',
  picked_up:  'bg-indigo-100 text-indigo-700',
  in_transit: 'bg-orange-100 text-orange-700',
  delivered:  'bg-teal-100 text-teal-700',
  confirmed:  'bg-green-100 text-green-700',
};

const STATUS_LABEL: Record<string, string> = {
  available:  'AVAILABLE',
  accepted:   'ACCEPTED',
  picked_up:  'PICKED UP',
  in_transit: 'IN TRANSIT',
  delivered:  'DELIVERED',
  confirmed:  'CONFIRMED',
};

export default function TransporterJobs() {
  const [jobs, setJobs]                   = useState<Job[]>([]);
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage]             = useState('');
  const [openMapJobId, setOpenMapJobId]   = useState<string | null>(null);
  const [updateText, setUpdateText]       = useState<Record<string, string>>({});
  const [postingUpdate, setPostingUpdate] = useState<string | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    fetch('/api/delivery-jobs')
      .then(r => r.json())
      .then(d => { setJobs(d.jobs || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const filtered = tab === 'all' ? jobs : jobs.filter(j => j.status === tab);

  const handleAction = async (jobId: string, action: string) => {
    setActionLoading(jobId + action);
    try {
      const res  = await fetch(`/api/delivery-jobs/${jobId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) { setMessage('✅ Updated!'); fetchJobs(); }
      else         { setMessage(`❌ ${data.error}`); }
    } catch { setMessage('❌ Something went wrong'); }
    setActionLoading(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const postUpdate = async (jobId: string) => {
    const text = updateText[jobId]?.trim();
    if (!text) return;
    setPostingUpdate(jobId);
    try {
      const res  = await fetch(`/api/delivery-jobs/${jobId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'post_update', message: text }),
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateText(prev => ({ ...prev, [jobId]: '' }));
        fetchJobs();
      } else { setMessage(`❌ ${data.error}`); }
    } catch { setMessage('❌ Failed to post update'); }
    setPostingUpdate(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleMap = (id: string) => setOpenMapJobId(prev => prev === id ? null : id);

  const tabCount = (t: string) =>
    t === 'all' ? jobs.length : jobs.filter(j => j.status === t).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Delivery Jobs</h1>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {t === 'all' ? 'All' : STATUS_LABEL[t] ?? t} ({tabCount(t)})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🚚</div><p>Loading jobs...</p></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📋</div><p>No jobs found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(job => (
            <div key={job._id} className={`card border transition-shadow hover:shadow-md ${
              ['accepted','picked_up','in_transit'].includes(job.status) ? 'border-primary-200 ring-1 ring-primary-100' : ''
            }`}>
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${STATUS_COLOR[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABEL[job.status] ?? job.status.toUpperCase()}
                </span>
                <span className="text-xl font-bold text-primary-600">৳{job.deliveryFee}</span>
              </div>

              {/* Product */}
              {job.productTitle && <p className="text-xs text-gray-400 mb-2">📦 {job.productTitle}</p>}

              {/* Route */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400">Pickup</div>
                  <div className="font-semibold text-sm text-gray-800">{job.pickupLocation.district}</div>
                  {job.pickupLocation.upazila && <div className="text-xs text-gray-500">{job.pickupLocation.upazila}</div>}
                </div>
                <div className="text-gray-400 text-xl">→</div>
                <div className="flex-1 bg-gray-50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400">Delivery</div>
                  <div className="font-semibold text-sm text-gray-800">{job.deliveryLocation.district}</div>
                  {job.deliveryLocation.upazila && <div className="text-xs text-gray-500">{job.deliveryLocation.upazila}</div>}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                <div>⚖️ <span className="font-medium">{job.productWeight} kg</span></div>
                <div>📅 {new Date(job.createdAt).toLocaleDateString('en-BD')}</div>
                {job.farmerName && <div>🌾 <span className="font-medium">{job.farmerName}</span></div>}
                {job.buyerName  && <div>🛒 <span className="font-medium">{job.buyerName}</span></div>}
              </div>

              {/* Farmer ready indicator */}
              {job.status === 'accepted' && (
                <div className={`rounded p-2 text-xs mb-3 ${job.farmerReadyAt ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  {job.farmerReadyAt
                    ? `✅ Farmer is ready for pickup since ${new Date(job.farmerReadyAt).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}`
                    : '⏳ Waiting for farmer to mark order ready for pickup'}
                </div>
              )}

              {/* Status updates feed */}
              {(job.statusUpdates?.length ?? 0) > 0 && (
                <div className="mb-3 space-y-1">
                  {job.statusUpdates!.slice().reverse().slice(0, 3).map((u, i) => (
                    <div key={i} className="bg-gray-50 rounded px-2 py-1 text-xs text-gray-600 flex justify-between gap-2">
                      <span>{u.message}</span>
                      <span className="text-gray-400 shrink-0">{new Date(u.createdAt).toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit' })}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Post update (in_transit) */}
              {job.status === 'in_transit' && (
                <div className="flex gap-2 mb-3">
                  <input
                    className="input flex-1 text-xs py-1.5"
                    placeholder="Post a delivery update..."
                    value={updateText[job._id] ?? ''}
                    onChange={e => setUpdateText(prev => ({ ...prev, [job._id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') postUpdate(job._id); }}
                  />
                  <button onClick={() => postUpdate(job._id)} disabled={postingUpdate === job._id}
                    className="btn-secondary text-xs px-3 py-1.5">
                    {postingUpdate === job._id ? '...' : 'Post'}
                  </button>
                </div>
              )}

              {/* Ratings received */}
              {job.status === 'confirmed' && (job.farmerRating || job.buyerRating) && (
                <div className="mb-3 bg-yellow-50 rounded p-2 text-xs text-yellow-800 space-y-1">
                  {job.farmerRating && <div>🌾 Farmer: {'⭐'.repeat(job.farmerRating.stars)} {job.farmerRating.comment && `— "${job.farmerRating.comment}"`}</div>}
                  {job.buyerRating  && <div>🛒 Buyer: {'⭐'.repeat(job.buyerRating.stars)} {job.buyerRating.comment && `— "${job.buyerRating.comment}"`}</div>}
                </div>
              )}

              {/* Map toggle */}
              <button onClick={() => toggleMap(job._id)}
                className="w-full text-xs py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors mb-2">
                {openMapJobId === job._id ? '🗺 Hide Map' : '🗺 Show Map'}
              </button>
              {openMapJobId === job._id && <JobMap pickup={job.pickupLocation} delivery={job.deliveryLocation} />}

              {/* Action buttons */}
              <div className="flex gap-2 mt-2">
                {job.status === 'available' && (
                  <button onClick={() => handleAction(job._id, 'accept')} disabled={actionLoading === job._id+'accept'}
                    className="btn-primary flex-1 text-sm py-2">
                    {actionLoading === job._id+'accept' ? 'Accepting...' : '✅ Accept Job'}
                  </button>
                )}
                {job.status === 'accepted' && (
                  <button onClick={() => handleAction(job._id, 'confirm_pickup')} disabled={actionLoading === job._id+'confirm_pickup'}
                    className="btn-primary flex-1 text-sm py-2">
                    {actionLoading === job._id+'confirm_pickup' ? '...' : '📦 Confirm Pickup'}
                  </button>
                )}
                {job.status === 'picked_up' && (
                  <button onClick={() => handleAction(job._id, 'start_transit')} disabled={actionLoading === job._id+'start_transit'}
                    className="btn-primary flex-1 text-sm py-2">
                    {actionLoading === job._id+'start_transit' ? '...' : '🚛 Start Delivery'}
                  </button>
                )}
                {job.status === 'in_transit' && (
                  <button onClick={() => handleAction(job._id, 'confirm_delivery')} disabled={actionLoading === job._id+'confirm_delivery'}
                    className="btn-primary flex-1 text-sm py-2">
                    {actionLoading === job._id+'confirm_delivery' ? '...' : '🏁 Confirm Delivery'}
                  </button>
                )}
                {job.status === 'delivered' && (
                  <div className="flex-1 text-center py-2 text-sm text-teal-600 font-medium bg-teal-50 rounded-lg">
                    ⏳ Waiting for buyer confirmation
                  </div>
                )}
                {job.status === 'confirmed' && (
                  <div className="flex-1 text-center py-2 text-sm text-green-600 font-medium">
                    ✅ Delivery Confirmed — ৳{job.deliveryFee} earned
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
