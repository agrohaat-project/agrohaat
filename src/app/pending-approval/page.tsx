'use client';
import { signOut } from 'next-auth/react';
export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h1 className="text-2xl font-bold mb-3">Account Pending Approval</h1>
        <p className="text-gray-600 mb-6">
          Your account is under review. Our admin team will approve your registration soon.
          You will be able to log in once approved.
        </p>
        <button onClick={() => signOut({ callbackUrl: '/login' })} className="btn-secondary">
          Back to Login
        </button>
      </div>
    </div>
  );
}
