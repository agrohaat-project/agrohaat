'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { DISTRICTS, CATEGORIES, QUALITY_GRADES, UNITS } from '@/lib/utils';

export default function EditProduct() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState<Record<string,unknown> | null>(null);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`).then(r => r.json()).then(d => {
      const p = d.product;
      setForm({
        title: p.title, description: p.description, category: p.category,
        price: p.price, quantity: p.quantity, unit: p.unit,
        qualityGrade: p.qualityGrade,
        harvestDate: p.harvestDate ? p.harvestDate.slice(0,10) : '',
        district: p.location?.district ?? '', upazila: p.location?.upazila ?? '',
        address: p.location?.address ?? '', images: p.images ?? [], isAvailable: p.isAvailable,
      });
    });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setLoading(true);
    const body = {
      ...form,
      price: Number(form.price), quantity: Number(form.quantity),
      location: { district: form.district, upazila: form.upazila, address: form.address },
    };
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return; }
    router.push('/farmer/products');
  };

  if (!form) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const f = form as Record<string,unknown>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/farmer/products" className="text-gray-500 hover:text-gray-700">←</Link>
        <h1 className="text-2xl font-bold">Edit Product</h1>
      </div>
      <form onSubmit={submit} className="card space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
        <div>
          <label className="label">Product Name</label>
          <input className="input" value={f.title as string} onChange={e => setForm(p=>({...p!,title:e.target.value}))} required />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={f.description as string} onChange={e => setForm(p=>({...p!,description:e.target.value}))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category</label>
            <select className="input" value={f.category as string} onChange={e => setForm(p=>({...p!,category:e.target.value}))}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Grade</label>
            <select className="input" value={f.qualityGrade as string} onChange={e => setForm(p=>({...p!,qualityGrade:e.target.value}))}>
              {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price (BDT)</label>
            <input type="number" className="input" value={f.price as number} onChange={e => setForm(p=>({...p!,price:e.target.value}))} />
          </div>
          <div>
            <label className="label">Unit</label>
            <select className="input" value={f.unit as string} onChange={e => setForm(p=>({...p!,unit:e.target.value}))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quantity</label>
            <input type="number" className="input" value={f.quantity as number} onChange={e => setForm(p=>({...p!,quantity:e.target.value}))} />
          </div>
          <div>
            <label className="label">Harvest Date</label>
            <input type="date" className="input" value={f.harvestDate as string} onChange={e => setForm(p=>({...p!,harvestDate:e.target.value}))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">District</label>
            <select className="input" value={f.district as string} onChange={e => setForm(p=>({...p!,district:e.target.value}))}>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Upazila</label>
            <input className="input" value={f.upazila as string} onChange={e => setForm(p=>({...p!,upazila:e.target.value}))} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="avail" checked={f.isAvailable as boolean}
            onChange={e => setForm(p=>({...p!,isAvailable:e.target.checked}))} />
          <label htmlFor="avail" className="text-sm font-medium text-gray-700">Available for sale</label>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/farmer/products" className="btn-secondary px-6">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
