'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { CATEGORIES, DISTRICTS, QUALITY_GRADES } from '@/lib/utils';

export default function BuyerProducts() {
  const [products, setProducts] = useState<Record<string,unknown>[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [district, setDistrict] = useState('all');
  const [grade,    setGrade]    = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  async function load(pg = 1) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: '12' });
    if (search)   params.set('search',   search);
    if (category !== 'all') params.set('category', category);
    if (district !== 'all') params.set('district', district);
    if (grade !== 'all')    params.set('grade',    grade);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    const res  = await fetch('/api/products?' + params);
    const data = await res.json();
    setProducts(data.products ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
    setPage(pg);
    setLoading(false);
  }

  useEffect(() => { load(1); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(1); };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Browse Products</h1>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input className="input flex-1" placeholder="Search products..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <button type="submit" className="btn-primary px-6">Search</button>
      </form>

      {/* Filters */}
      <div className="card p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="label text-xs">Category</label>
          <select className="input text-sm" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">District</label>
          <select className="input text-sm" value={district} onChange={e => setDistrict(e.target.value)}>
            <option value="all">All Districts</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Quality Grade</label>
          <select className="input text-sm" value={grade} onChange={e => setGrade(e.target.value)}>
            <option value="all">All Grades</option>
            {QUALITY_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="label text-xs">Min Price (৳)</label>
          <input type="number" className="input text-sm" placeholder="0"
            value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        </div>
        <div>
          <label className="label text-xs">Max Price (৳)</label>
          <input type="number" className="input text-sm" placeholder="Any"
            value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
        <div className="col-span-2 md:col-span-5 flex justify-between items-center">
          <span className="text-sm text-gray-500">{total} products found</span>
          <div className="flex gap-2">
            <button onClick={() => load(1)} className="btn-primary text-sm py-1.5 px-4">Apply Filters</button>
            <button onClick={() => {
              setSearch(''); setCategory('all'); setDistrict('all');
              setGrade('all'); setMinPrice(''); setMaxPrice('');
              setTimeout(() => load(1), 0);
            }} className="btn-secondary text-sm py-1.5 px-4">Clear</button>
          </div>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No products found.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map(p => (
              <Link href={`/buyer/products/${p._id}`} key={p._id as string}
                className="card hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer block">
                <div className="relative">
                  {(p.images as string[])?.[0] ? (
                    <img src={(p.images as string[])[0]} alt={p.title as string}
                      className="w-full h-44 object-cover rounded-lg mb-3" />
                  ) : (
                    <div className="w-full h-44 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">🌾</div>
                  )}
                  <span className="absolute top-2 right-2 badge bg-white text-gray-700 border border-gray-200 text-xs">
                    Grade {p.qualityGrade as string}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{p.title as string}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {p.category as string} • 📍 {(p.location as Record<string,string>)?.district}
                </p>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description as string}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary-600">
                    {formatCurrency(p.price as number)}<span className="text-sm font-normal text-gray-500">/{p.unit as string}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {p.quantity as number} {p.unit as string} left
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">by {p.farmerName as string}</p>
              </Link>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({length: pages}, (_, i) => i + 1).map(pg => (
                <button key={pg} onClick={() => load(pg)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium ${pg === page ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  {pg}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
