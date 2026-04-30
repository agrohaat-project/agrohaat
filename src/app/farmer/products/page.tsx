'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export default function FarmerProducts() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading]   = useState(true);

  async function load() {
    if (!session) return;
    setLoading(true);
    const res  = await fetch('/api/products?farmerId=' + session.user.id + '&limit=50');
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [session]);

  async function toggleAvailability(id: string, current: boolean) {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable: !current }),
    });
    load();
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Link href="/farmer/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🌾</div>
          <p className="text-gray-600 mb-4">You haven't listed any products yet.</p>
          <Link href="/farmer/products/new" className="btn-primary">List Your First Product</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p: Record<string,unknown>) => (
            <div key={p._id as string} className="card hover:shadow-md transition-shadow">
              {(p.images as string[])?.[0] && (
                <img src={(p.images as string[])[0]} alt={p.title as string}
                  className="w-full h-36 object-cover rounded-lg mb-3" />
              )}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{p.title as string}</h3>
                <span className={`badge text-xs ${p.isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {p.isAvailable ? 'Listed' : 'Hidden'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{p.category as string} • Grade {p.qualityGrade as string}</p>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-primary-600">{formatCurrency(p.price as number)}/{p.unit as string}</span>
                <span className="text-sm text-gray-500">Qty: {p.quantity as number} {p.unit as string}</span>
              </div>
              <div className="flex gap-2">
                <Link href={`/farmer/products/${p._id}/edit`}
                  className="flex-1 text-center btn-secondary text-sm py-1.5">Edit</Link>
                <button onClick={() => toggleAvailability(p._id as string, p.isAvailable as boolean)}
                  className="flex-1 btn-secondary text-sm py-1.5">
                  {p.isAvailable ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => deleteProduct(p._id as string)}
                  className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
