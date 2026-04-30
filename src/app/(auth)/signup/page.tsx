'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DISTRICTS } from '@/lib/utils';

export default function SignupPage() {
  const router = useRouter();
  const [defaultRole, setDefaultRole] = useState('buyer');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDefaultRole(params.get('role') ?? 'buyer');
  }, []);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    role: defaultRole,
    district: '', upazila: '', address: '',
  });

  useEffect(() => {
    setForm(prev => ({ ...prev, role: defaultRole }));
  }, [defaultRole]);

  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, password: form.password,
          phone: form.phone, role: form.role,
          location: { district: form.district, upazila: form.upazila, address: form.address },
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Registration failed'); return; }
      setSuccess(data.message);
      setTimeout(() => router.push('/login'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50 to-green-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6 justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200">🌾</span>
            <div className="text-left">
              <span className="text-3xl font-bold text-green-700 group-hover:text-green-800 transition-colors duration-200">AgroHaat</span>
              <p className="text-xs text-gray-500 font-medium">Agricultural Marketplace</p>
            </div>
          </Link>
          <p className="text-lg text-gray-700 font-bold">Create your account</p>
          <p className="text-sm text-gray-500 mt-1">Join our agricultural community</p>
        </div>
        <div className="card">
          {success ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
              <p className="text-gray-600 font-medium">{success}</p>
              <p className="text-sm text-gray-500 mt-3">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>
              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              {/* Role Selection */}
              <div>
                <label className="label">👥 I am a</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'farmer', icon: '👨‍🌾', label: 'Farmer' },
                    { value: 'buyer',  icon: '🛒', label: 'Buyer' },
                    { value: 'transporter', icon: '🚛', label: 'Transporter' },
                    { value: 'specialist', icon: '🔬', label: 'Specialist' },
                  ].map(r => (
                    <button key={r.value} type="button"
                      onClick={() => setForm(p => ({ ...p, role: r.value }))}
                      className={`p-4 rounded-xl border-2 text-center transition-all transform hover:scale-105 font-bold ${
                        form.role === r.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}>
                      <div className="text-2xl">{r.icon}</div>
                      <div className="text-xs font-bold mt-2">{r.label}</div>
                    </button>
                  ))}
                </div>
                {form.role !== 'buyer' && (
                  <p className="text-xs text-amber-700 mt-3 bg-amber-50 p-3 rounded-lg border-l-4 border-amber-500 font-medium">
                    ⚠️ {form.role === 'farmer' ? 'Farmer' : form.role === 'transporter' ? 'Transporter' : 'Specialist'} accounts need admin approval before you can use the platform.
                  </p>
                )}
                {form.role === 'specialist' && (
                  <p className="text-xs text-blue-700 mt-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500 font-medium">
                    🔬 Agricultural Specialists provide expert guidance and support to farmers. Your expertise matters!
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="col-span-2">
                  <label className="label">👤 Full Name</label>
                  <input className="input" placeholder="Rahim Uddin"
                    value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="label">📧 Email Address</label>
                  <input type="email" className="input" placeholder="you@example.com"
                    value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="col-span-2">
                  <label className="label">📞 Phone Number</label>
                  <input type="tel" className="input" placeholder="01XXXXXXXXX"
                    value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">🔐 Password</label>
                  <input type="password" className="input" placeholder="Min 6 characters"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">✓ Confirm Password</label>
                  <input type="password" className="input" placeholder="Repeat password"
                    value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required />
                </div>
              </div>

              <div className="border-t-2 border-gray-100 pt-5">
                <div>
                  <label className="label">📍 District</label>
                  <select className="input" value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))}>
                    <option value="">Select your district</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">🗺️ Upazila</label>
                  <input className="input" placeholder="Upazila / Thana / Sub-district"
                    value={form.upazila} onChange={e => setForm(p => ({ ...p, upazila: e.target.value }))} />
                </div>
                <div>
                  <label className="label">🏡 Address</label>
                  <input className="input" placeholder="Village / Street / Area name"
                    value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3.5 font-bold text-lg mt-2" disabled={loading}>
                {loading ? '⏳ Creating Account...' : '✨ Create Account'}
              </button>
            </form>
          )}
          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
