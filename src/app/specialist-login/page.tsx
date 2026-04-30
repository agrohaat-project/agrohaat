'use client';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SpecialistLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackError = params.get('error');
    if (callbackError === 'CredentialsSignin') {
      setError('Invalid email or password.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin'
            ? 'Invalid email or password.'
            : result.error
        );
      } else {
        router.push('/specialist/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200">🔬</span>
            <div className="text-left">
              <span className="text-3xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-200">AgroHaat</span>
              <p className="text-xs text-gray-500 font-medium">Agricultural Marketplace</p>
            </div>
          </Link>
          <p className="mt-4 text-lg text-gray-700 font-bold">Specialist Login</p>
          <p className="text-sm text-gray-500 mt-1">Access your specialist dashboard</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl font-semibold text-sm animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label className="label">📧 Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="specialist@example.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">🔐 Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '✨ Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t-2 border-gray-100">
            <p className="text-center text-sm text-gray-600 mb-4">
              Don't have an account?{' '}
              <Link
                href="/specialist-signup"
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors"
              >
                Register as Specialist
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500">
              Not a specialist?{' '}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-5 text-center">
          <p className="text-sm text-blue-700 font-medium mb-2">🔬 Agricultural Specialist?</p>
          <p className="text-xs text-blue-600">
            Share your expertise with farmers and help them grow better crops. Get approved and start helping today!
          </p>
        </div>
      </div>
    </div>
  );
}
