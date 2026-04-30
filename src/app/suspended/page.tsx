'use client';
import { signOut } from 'next-auth/react';
export default function Suspended() {
  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-3">Account Suspended</h1>
        <p className="text-gray-600 mb-6">Your account has been suspended. Please contact admin.</p>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-danger">Sign Out</button>
      </div>
    </div>
  );
}
