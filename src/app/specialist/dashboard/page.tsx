'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ConversationCount {
  activeConversations: number;
  totalFarmers: number;
  unrepliedMessages: number;
}

export default function SpecialistDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ConversationCount | null>(null);
  const [recentConversations, setRecentConversations] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch('/api/specialist/conversations');
        const data = await response.json();
        setStats({
          activeConversations: data.activeConversations || 0,
          totalFarmers: data.totalFarmers || 0,
          unrepliedMessages: data.unrepliedMessages || 0,
        });
        setRecentConversations(data.recentConversations || []);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    }
    if (session) loadStats();
  }, [session]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {session?.user.name} 👋</h1>
          <p className="text-gray-500">Agricultural Specialist Panel - Support farmers with expert advice</p>
        </div>
        <Link href="/specialist/messages" className="btn-primary">💬 View All Messages</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Conversations', value: stats?.activeConversations ?? '...', icon: '💬', color: 'bg-blue-50 border-blue-200' },
          { label: 'Farmers Connected', value: stats?.totalFarmers ?? '...', icon: '👨‍🌾', color: 'bg-green-50 border-green-200' },
          { label: 'Messages to Reply', value: stats?.unrepliedMessages ?? '...', icon: '⏳', color: 'bg-orange-50 border-orange-200' },
        ].map((s) => (
          <div key={s.label} className={`card border ${s.color}`}>
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Conversations */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Recent Conversations</h2>
          <Link href="/specialist/messages" className="text-primary-600 text-sm hover:underline">View all →</Link>
        </div>
        {loading ? (
          <p className="text-gray-500 py-4 text-center">Loading conversations...</p>
        ) : recentConversations.length === 0 ? (
          <p className="text-gray-500 py-4 text-center">No conversations yet.</p>
        ) : (
          <div className="space-y-3">
            {recentConversations.map((conv: Record<string, unknown>) => (
              <Link href={`/specialist/messages?farmerId=${conv.farmerId as string}`} key={conv.farmerId as string}>
                <div className="flex items-center justify-between py-3 px-3 border rounded-lg hover:bg-green-50 transition cursor-pointer border-gray-200">
                  <div>
                    <p className="font-medium text-sm">{conv.farmerName as string}</p>
                    <p className="text-xs text-gray-500">{conv.lastMessage as string}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{conv.lastMessageTime as string}</p>
                    {(conv.unreadCount as number) > 0 && (
                      <span className="inline-block mt-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {conv.unreadCount as number}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
        <h3 className="text-lg font-bold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/specialist/messages" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition border border-gray-200">
            <span className="text-2xl">💬</span>
            <div>
              <p className="font-semibold text-sm">View Messages</p>
              <p className="text-xs text-gray-500">Check farmer conversations</p>
            </div>
          </Link>
          <Link href="/learning-hub" className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-md transition border border-gray-200">
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-semibold text-sm">Learning Hub</p>
              <p className="text-xs text-gray-500">Share educational content</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
