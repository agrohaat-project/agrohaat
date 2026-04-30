'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DISTRICTS, CATEGORIES, QUALITY_GRADES, UNITS } from '@/lib/utils';

export default function NewProduct() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '', description: '', category: '', price: '', quantity: '',
    unit: 'kg', qualityGrade: 'A', harvestDate: '',
    district: '', upazila: '', address: '',
  });
  const [images, setImages]   = useState<string[]>([]);
  const [imgUrl, setImgUrl]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res  = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (data.url) setImages(p => [...p, data.url]);
    else setError(data.error ?? 'Upload failed');
    setUploading(false);
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.quantity || !form.category || !form.district) {
      setError('Please fill all required fields'); return;
    }
    setLoading(true);
    const body = {
      title: form.title, description: form.description, category: form.category,
      price: Number(form.price), quantity: Number(form.quantity),
      unit: form.unit, qualityGrade: form.qualityGrade,
      harvestDate: form.harvestDate || new Date().toISOString(),
      location: { district: form.district, upazila: form.upazila, address: form.address },
      images,
    };
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed'); setLoading(false); return; }
    router.push('/farmer/products');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/farmer/products" className="text-gray-500 hover:text-gray-700">←</Link>
        <h1 className="text-2xl font-bold">Add New Product</h1>
      </div>

      <form onSubmit={submit} className="card space-y-5">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="label">Product Name *</label>
          <input className="input" placeholder="e.g. Fresh Tomato, Boro Rice"
            value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} required />
        </div>
        <div>
          <label className="label">Description *</label>
          <textarea className="input" rows={3} placeholder="Describe your product quality, origin, etc."
            value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} required>
              <option value="">Select category</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Quality Grade *</label>
            <select className="input" value={form.qualityGrade} onChange={e => setForm(p=>({...p,qualityGrade:e.target.value}))}>
              {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Price (BDT) *</label>
            <input type="number" className="input" placeholder="0" min="0"
              value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} required />
          </div>
          <div>
            <label className="label">Unit *</label>
            <select className="input" value={form.unit} onChange={e => setForm(p=>({...p,unit:e.target.value}))}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Available Quantity *</label>
            <input type="number" className="input" placeholder="0" min="0"
              value={form.quantity} onChange={e => setForm(p=>({...p,quantity:e.target.value}))} required />
          </div>
          <div>
            <label className="label">Harvest Date</label>
            <input type="date" className="input"
              value={form.harvestDate} onChange={e => setForm(p=>({...p,harvestDate:e.target.value}))} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">District *</label>
            <select className="input" value={form.district} onChange={e => setForm(p=>({...p,district:e.target.value}))} required>
              <option value="">Select district</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Upazila</label>
            <input className="input" placeholder="Upazila" value={form.upazila}
              onChange={e => setForm(p=>({...p,upazila:e.target.value}))} />
          </div>
          <div className="col-span-2">
            <label className="label">Pickup Address</label>
            <input className="input" placeholder="Farm / village address"
              value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="label">Product Images</label>
          <div className="flex gap-2 mb-2">
            <input type="file" accept="image/*" className="input text-sm" onChange={handleFileUpload} disabled={uploading} />
            {uploading && <span className="text-sm text-gray-500 self-center">Uploading...</span>}
          </div>
          <div className="flex gap-2 mb-2">
            <input className="input text-sm flex-1" placeholder="Or paste image URL"
              value={imgUrl} onChange={e => setImgUrl(e.target.value)} />
            <button type="button" onClick={() => { if(imgUrl){setImages(p=>[...p,imgUrl]);setImgUrl('');} }}
              className="btn-secondary text-sm px-3">Add URL</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} className="w-16 h-16 object-cover rounded-lg border" alt="" />
                <button type="button" onClick={() => setImages(p=>p.filter((_,j)=>j!==i))}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" className="btn-primary flex-1" disabled={loading}>
            {loading ? 'Saving...' : '✓ List Product'}
          </button>
          <Link href="/farmer/products" className="btn-secondary px-6">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
