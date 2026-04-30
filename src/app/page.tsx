'use client';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = session.user.role;
      if (role === 'farmer')      router.push('/farmer/dashboard');
      else if (role === 'buyer')  router.push('/buyer/dashboard');
      else if (role === 'transporter') router.push('/transporter/dashboard');
      else if (role === 'specialist') router.push('/specialist/dashboard');
      else if (role === 'admin')  router.push('/admin/dashboard');
      else router.push('/buyer/products');
    }
  }, [status, session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌾</span>
              <span className="text-xl font-bold text-primary-700">AgroHaat</span>
            </div>
            <div className="flex gap-3 items-center">
              <Link href="/specialist-login" className="text-sm text-blue-600 font-semibold hover:text-blue-700">🔬 Specialist</Link>
              <Link href="/login" className="btn-secondary text-sm">Login</Link>
              <Link href="/signup" className="btn-primary text-sm">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
          <span>🇧🇩</span> Bangladesh's #1 Agricultural Marketplace
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Farm Fresh, Direct to You<br/>
          <span className="text-primary-600">No Middlemen, Fair Prices</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          AgroHaat connects farmers directly with buyers across Bangladesh.
          Buy rice, vegetables, fish and more straight from the source.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup?role=buyer" className="btn-primary text-lg px-8 py-3">
            🛒 Start Buying
          </Link>
          <Link href="/signup?role=farmer" className="btn-secondary text-lg px-8 py-3">
            🌱 Sell Your Harvest
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: 'Active Farmers', value: '500+' },
            { label: 'Products Listed', value: '2,000+' },
            { label: 'Orders Completed', value: '10,000+' },
            { label: 'Districts Covered', value: '64' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-4xl font-bold">{s.value}</div>
              <div className="text-primary-200 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🌾', title: 'Farmers List Products', desc: 'Register as a farmer and list your harvest with photos, price, and quantity. Reach thousands of buyers.' },
            { icon: '🛒', title: 'Buyers Place Orders', desc: 'Browse products by category, location or price. Order directly and pay via bKash or Nagad.' },
            { icon: '🚚', title: 'Transporters Deliver', desc: 'Verified transporters pick up orders and deliver to buyers across Bangladesh.' },
            { icon: '🎓', title: 'Learning Hub', desc: 'Access video guides, infographics and expert tips on crop care, fertilizers, pesticides and cost reduction.', href: '/learning-hub' },
          ].map(f => (
            f.href ? (
              <Link key={f.title} href={f.href} className="card text-center hover:shadow-xl hover:scale-105 transition-all cursor-pointer border-2 border-green-100 hover:border-green-300">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-green-700">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
                <span className="inline-block mt-4 text-sm text-green-600 font-bold">Explore →</span>
              </Link>
            ) : (
              <div key={f.title} className="card text-center hover:shadow-md transition-shadow">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-gray-600">{f.desc}</p>
              </div>
            )
          ))}
        </div>
      </section>

      {/* Role Cards */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Join AgroHaat Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { role: 'farmer', icon: '👨‍🌾', title: 'Farmer', desc: 'List products, manage orders, access learning resources', color: 'border-green-400 bg-green-50', href: '/signup?role=farmer' },
              { role: 'buyer', icon: '🏪', title: 'Buyer', desc: 'Browse fresh produce, pay securely, track deliveries', color: 'border-blue-400 bg-blue-50', href: '/signup?role=buyer' },
              { role: 'transporter', icon: '🚛', title: 'Transporter', desc: 'Accept delivery jobs, earn money transporting goods', color: 'border-amber-400 bg-amber-50', href: '/signup?role=transporter' },
              { role: 'specialist', icon: '🔬', title: 'Specialist', desc: 'Share expertise, guide farmers, help crops grow better', color: 'border-blue-600 bg-blue-50', href: '/specialist-signup' },
            ].map(r => (
              <Link href={r.href} key={r.role}
                className={`card border-2 ${r.color} hover:scale-105 transition-transform cursor-pointer`}>
                <div className="text-5xl mb-3">{r.icon}</div>
                <h3 className="text-xl font-bold mb-2">{r.title}</h3>
                <p className="text-gray-600 text-sm">{r.desc}</p>
                <div className="mt-4 text-primary-600 font-semibold text-sm">Register as {r.title} →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© 2026 AgroHaat. Built for Bangladesh's farmers. 🌾</p>
      </footer>
    </div>
  );
}
