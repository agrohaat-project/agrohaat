'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { formatCurrency, formatDate, DISTRICTS } from '@/lib/utils';

const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };

export default function ProductDetail() {
  const { id }   = useParams();
  const router   = useRouter();
  const { data: session } = useSession();

  const [product, setProduct]           = useState<Record<string, unknown> | null>(null);
  const [orderQty, setOrderQty]         = useState(1);
  const [district, setDistrict]         = useState('');
  const [upazila, setUpazila]           = useState('');
  const [address, setAddress]           = useState('');
  const [notes, setNotes]               = useState('');
  const [ordering, setOrdering]         = useState(false);
  const [orderError, setOrderError]     = useState('');
  const [orderSuccess, setOrderSuccess] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);

  // Map picker state
  const [useMapPicker, setUseMapPicker] = useState(false);
  const [pinPosition, setPinPosition]   = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding]       = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => setProduct(d.product));
  }, [id]);

  useEffect(() => {
    if (product) setSelectedImage(0);
  }, [product?._id]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPinPosition(pos);
    setGeocoding(true);

    new google.maps.Geocoder().geocode({ location: pos }, (results, status) => {
      setGeocoding(false);
      if (status !== 'OK' || !results?.[0]) return;

      const comps = results[0].address_components;
      const find  = (type: string) => comps.find(c => c.types.includes(type));

      const districtRaw = find('administrative_area_level_2')?.long_name ?? '';
      if (districtRaw) {
        const cleaned = districtRaw.replace(/\s*(District|Zila|জেলা)\s*/gi, '').trim();
        const matched = DISTRICTS.find(d => d.toLowerCase() === cleaned.toLowerCase());
        setDistrict(matched ?? cleaned);
      }

      const upazilaName =
        find('administrative_area_level_3')?.long_name ??
        find('locality')?.long_name ?? '';
      setUpazila(upazilaName);

      const parts = [
        find('premise')?.long_name,
        find('route')?.long_name,
      ].filter(Boolean);
      setAddress(
        parts.length ? parts.join(', ') : results[0].formatted_address.split(',')[0]
      );
    });
  }, []);

  if (!product) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const p      = product;
  const images = (p.images as string[]) ?? [];
  const loc    = p.location as Record<string, string>;

  const placeOrder = async () => {
    setOrderError(''); setOrderSuccess('');
    if (orderQty < 1 || orderQty > (p.quantity as number)) {
      setOrderError(`Quantity must be between 1 and ${p.quantity}`); return;
    }
    if (!district) { setOrderError('Please select a delivery district'); return; }
    setOrdering(true);
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: p._id, quantity: orderQty,
        deliveryAddress: { district, upazila, address },
        notes,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setOrderError(data.error ?? 'Failed to place order'); setOrdering(false); return; }
    setOrderSuccess('Order placed! Waiting for farmer confirmation.');
    setTimeout(() => router.push('/buyer/orders'), 2000);
    setOrdering(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/buyer/products" className="text-gray-500 hover:text-gray-700 text-sm">← Back</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Images */}
        <div>
          {images.length > 0 ? (
            <img src={images[selectedImage]} alt={p.title as string} className="w-full h-72 object-cover rounded-xl" />
          ) : (
            <div className="w-full h-72 bg-gray-100 rounded-xl flex items-center justify-center text-6xl">🌾</div>
          )}
          {images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                    i === selectedImage
                      ? 'border-primary-600 ring-2 ring-primary-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img} className="w-full h-full object-cover rounded-md" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <span className="badge bg-primary-100 text-primary-700 text-xs mb-2">{p.category as string}</span>
            <h1 className="text-2xl font-bold">{p.title as string}</h1>
            <p className="text-gray-600 mt-2">{p.description as string}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500">Price</p>
              <p className="text-xl font-bold text-primary-600">{formatCurrency(p.price as number)}/{p.unit as string}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500">Available</p>
              <p className="font-bold">{p.quantity as number} {p.unit as string}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500">Quality Grade</p>
              <p className="font-bold">{p.qualityGrade as string}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-gray-500">Harvest Date</p>
              <p className="font-bold">{formatDate(p.harvestDate as string)}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="text-gray-500">Farmer</p>
            <p className="font-bold">{p.farmerName as string}</p>
            <p className="text-gray-500">{p.farmerPhone as string}</p>
            <p className="text-gray-500">📍 {loc?.district}, {loc?.upazila}</p>
          </div>
        </div>
      </div>

      {/* Order Section */}
      <div className="card">
        <h2 className="text-lg font-bold mb-4">Place Your Order</h2>
        {orderSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
            ✅ {orderSuccess} Redirecting...
          </div>
        ) : (
          <div className="space-y-4">
            {orderError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {orderError}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="label">Quantity ({p.unit as string})</label>
              <input
                type="number" className="input max-w-xs"
                min={1} max={p.quantity as number}
                value={orderQty} onChange={e => setOrderQty(Number(e.target.value))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Total: <strong>{formatCurrency((p.price as number) * orderQty)}</strong>
              </p>
            </div>

            {/* Delivery location */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Delivery Location</label>
                <button
                  type="button"
                  onClick={() => setUseMapPicker(v => !v)}
                  className="text-xs px-3 py-1 rounded-full border border-primary-300 text-primary-600 hover:bg-primary-50 transition-colors"
                >
                  {useMapPicker ? '✏️ Enter manually' : '📍 Drop a pin on map'}
                </button>
              </div>

              {useMapPicker && (
                <div className="mb-3">
                  {!isLoaded ? (
                    <div className="h-52 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                      Loading map...
                    </div>
                  ) : (
                    <>
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '210px', borderRadius: '8px' }}
                        center={pinPosition ?? DHAKA_CENTER}
                        zoom={pinPosition ? 14 : 7}
                        onClick={handleMapClick}
                        options={{
                          gestureHandling: 'greedy',
                          fullscreenControl: false,
                          streetViewControl: false,
                          mapTypeControl: false,
                        }}
                      >
                        {pinPosition && <Marker position={pinPosition} />}
                      </GoogleMap>
                      <p className="text-xs text-gray-400 mt-1">
                        {geocoding
                          ? '⏳ Detecting address...'
                          : pinPosition
                            ? '✅ Address detected — edit the fields below if needed'
                            : '👆 Click anywhere on the map to drop your delivery pin'}
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">District *</label>
                  <select className="input" value={district} onChange={e => setDistrict(e.target.value)} required>
                    <option value="">Select district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Upazila</label>
                  <input
                    className="input" placeholder="Upazila"
                    value={upazila} onChange={e => setUpazila(e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Street / House / Area</label>
                  <input
                    className="input" placeholder="Street / House / Area"
                    value={address} onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes for Farmer (optional)</label>
              <textarea
                className="input" rows={2} placeholder="Special instructions..."
                value={notes} onChange={e => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={placeOrder} disabled={ordering || !session}
              className="btn-primary w-full py-3 text-base"
            >
              {!session
                ? 'Login to Order'
                : ordering
                  ? 'Placing Order...'
                  : `🛒 Place Order — ${formatCurrency((p.price as number) * orderQty)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
