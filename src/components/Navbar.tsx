'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const role = session?.user?.role;

  const dashLink = role === 'farmer' ? '/farmer/dashboard'
    : role === 'buyer'  ? '/buyer/dashboard'
    : role === 'transporter' ? '/transporter/dashboard'
    : role === 'admin'  ? '/admin/dashboard'
    : '/';

  return (
    <nav className="bg-gradient-to-r from-green-600 to-green-700 shadow-xl border-b-4 border-green-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-2">
          <Link href={dashLink} className="flex items-center gap-3 group">
            <span className="text-3xl group-hover:scale-110 transition-transform duration-200">🌾</span>
            <div>
              <span className="text-2xl font-bold text-white group-hover:text-green-100 transition-colors duration-200">AgroHaat</span>
              <p className="text-xs text-green-100 font-medium">Agricultural Marketplace</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {session ? (
              <>
                <div className="hidden sm:flex items-center gap-3 px-5 py-2 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm border border-white border-opacity-30">
                  <span className="text-sm text-white font-bold">{session.user.name}</span>
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-md">
                    {session.user.role}
                  </span>
                </div>
                <button onClick={() => signOut({ callbackUrl: '/login' })}
                  className="bg-white text-green-700 hover:bg-green-50 font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-green-100 font-bold text-sm transition-colors duration-200 hover:underline">Login</Link>
                <Link href="/signup" className="bg-white text-green-700 hover:bg-green-50 font-bold py-2.5 px-5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-sm">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
