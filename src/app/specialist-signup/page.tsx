'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DISTRICTS } from '@/lib/utils';

const SPECIALIZATIONS = [
  'Crop Management',
  'Pest & Disease Control',
  'Soil & Fertilizer',
  'Vegetable Farming',
  'Fruit Farming',
  'Fish Farming',
  'Dairy Farming',
  'Poultry Farming',
  'Irrigation',
  'Organic Farming',
  'Climate Adaptation',
  'Farm Economics',
];

export default function SpecialistSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    qualification: '',
    experience: '',
    specializations: [] as string[],
    bio: '',
    district: '',
    upazila: '',
    address: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpecializationChange = (spec: string) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (form.specializations.length === 0) {
      setError('Please select at least one specialization');
      return;
    }

    if (!form.qualification) {
      setError('Please enter your qualification/background');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
          role: 'specialist',
          location: { district: form.district, upazila: form.upazila, address: form.address },
          bio: form.bio,
          interests: form.specializations,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Registration failed');
        return;
      }

      setSuccess(data.message);
      setTimeout(() => router.push('/login'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 group mb-6 justify-center">
            <span className="text-5xl group-hover:scale-110 transition-transform duration-200">🔬</span>
            <div className="text-left">
              <span className="text-3xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-200">AgroHaat</span>
              <p className="text-xs text-gray-500 font-medium">Agricultural Marketplace</p>
            </div>
          </Link>
          <p className="text-lg text-gray-700 font-bold">Join as an Agricultural Specialist</p>
          <p className="text-sm text-gray-500 mt-1">Share your expertise and help farmers grow</p>
        </div>

        <div className="card">
          {success ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
              <p className="text-gray-600 font-medium">{success}</p>
              <p className="text-sm text-blue-600 mt-3 font-semibold">Your account has been submitted for admin approval. You'll be notified once approved.</p>
              <p className="text-xs text-gray-500 mt-2">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🔬 Specialist Profile</h2>
              <p className="text-sm text-gray-600 mb-6">Help farmers with expert agricultural guidance and support</p>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 text-red-700 px-5 py-4 rounded-xl text-sm font-semibold animate-pulse">
                  ⚠️ {error}
                </div>
              )}

              {/* Personal Information */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">👤 Full Name</label>
                    <input
                      className="input"
                      placeholder="Dr. Ahmed Khan"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
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
                    <label className="label">📞 Phone Number</label>
                    <input
                      type="tel"
                      className="input"
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Professional Background */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🎓 Professional Background</h3>
                <div>
                  <label className="label">Qualification / Education</label>
                  <input
                    className="input"
                    placeholder="e.g., B.Sc. in Agriculture, M.Sc. in Plant Pathology"
                    value={form.qualification}
                    onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))}
                    required
                  />
                </div>
                <div className="mt-4">
                  <label className="label">Years of Experience</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="e.g., 10"
                    min="0"
                    max="60"
                    value={form.experience}
                    onChange={e => setForm(p => ({ ...p, experience: e.target.value }))}
                    required
                  />
                </div>
                <div className="mt-4">
                  <label className="label">Bio / About You</label>
                  <textarea
                    className="input resize-none"
                    rows={3}
                    placeholder="Tell farmers about your expertise and experience..."
                    value={form.bio}
                    onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  />
                </div>
              </div>

              {/* Specializations */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🌾 Areas of Specialization</h3>
                <p className="text-sm text-gray-600 mb-4">Select all that apply (choose at least one)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SPECIALIZATIONS.map(spec => (
                    <label key={spec} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={form.specializations.includes(spec)}
                        onChange={() => handleSpecializationChange(spec)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-700">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📍 Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">District</label>
                    <select
                      className="input"
                      value={form.district}
                      onChange={e => setForm(p => ({ ...p, district: e.target.value }))}
                    >
                      <option value="">Select district</option>
                      {DISTRICTS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Upazila / Thana</label>
                    <input
                      className="input"
                      placeholder="Upazila name"
                      value={form.upazila}
                      onChange={e => setForm(p => ({ ...p, upazila: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Address</label>
                    <input
                      className="input"
                      placeholder="Office / Organization"
                      value={form.address}
                      onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className="border-t-2 border-gray-100 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">🔐 Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Min 6 characters"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium">
                  ℹ️ <strong>Admin Approval Required:</strong> Your account will be reviewed by our admin team. You'll be notified once approved. This helps us maintain quality of expert guidance.
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 font-bold text-lg mt-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={loading}
              >
                {loading ? '⏳ Creating Account...' : '✨ Register as Specialist'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 hover:underline transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-center text-xs text-gray-500 mt-3">
              Not a specialist?{' '}
              <Link href="/signup" className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors">
                Sign up as Farmer, Buyer, or Transporter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
