'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';

interface ChatMessage {
  _id: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [activeRoom, setActiveRoom] = useState('');
  const [customRoom, setCustomRoom] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendStatus, setSendStatus] = useState('');

  const userRole = session?.user?.role;
  const fixedRoom = useMemo(() => {
    if (userRole === 'farmer' && session?.user?.id) {
      return `farmer-${session.user.id}`;
    }
    if (userRole === 'specialist' && activeRoom) {
      return activeRoom;
    }
    return '';
  }, [userRole, session?.user?.id, activeRoom]);

  useEffect(() => {
    if (!fixedRoom) return;
    let active = true;
    setLoading(true);
    async function loadMessages() {
      const response = await fetch(`/api/chat?room=${encodeURIComponent(fixedRoom)}`);
      const data = await response.json();
      if (!active) return;
      setMessages(data.messages ?? []);
      setLoading(false);
    }
    loadMessages();
    const interval = setInterval(loadMessages, 2500);
    return () => { active = false; clearInterval(interval); };
  }, [fixedRoom]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fixedRoom) return;
    if (!text.trim()) return;
    setSendStatus('Sending message...');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: fixedRoom, text: text.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message');
      setText('');
      setSendStatus('Message sent.');
    } catch (err: unknown) {
      setSendStatus(err instanceof Error ? err.message : 'Send failed');
    }
  }

  if (status === 'loading') {
    return <div className="text-center py-12 text-gray-500">Checking your session...</div>;
  }

  if (!session?.user) {
    return <div className="text-center py-12 text-gray-500">Please sign in to access chat.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Live Specialist Chat</h1>
            <p className="mt-2 text-gray-500">Ask agricultural specialists for advice, share updates, and follow crop support conversations in real time.</p>
          </div>
          <div className="rounded-3xl bg-green-700 p-4 text-white shadow-md">
            <p className="text-sm">Logged in as <strong>{session.user.name}</strong></p>
            <p className="text-sm">Role: {session.user.role}</p>
          </div>
        </div>
      </div>

      {userRole === 'specialist' && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="label">View farmer conversation</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={customRoom}
              onChange={e => setCustomRoom(e.target.value)}
              placeholder="Enter room like farmer-USER_ID"
              className="input flex-1"
            />
            <button onClick={() => setActiveRoom(customRoom)} type="button" className="btn-primary py-3">
              Open Room
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Example room ID: <code className="rounded bg-slate-100 px-1">farmer-643f...</code></p>
        </div>
      )}

      {!fixedRoom ? (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          {userRole === 'farmer'
            ? 'Preparing your farmer chat room...'
            : 'Enter a farmer chat room to start messaging specialists.'}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Room: {fixedRoom}</h2>
                <p className="text-sm text-gray-500">Messages update automatically every few seconds.</p>
              </div>
              <span className="badge bg-blue-100 text-blue-800">{messages.length} messages</span>
            </div>

            <div className="mb-4 max-h-[520px] overflow-y-auto rounded-3xl border border-gray-100 bg-slate-50 p-4 space-y-3">
              {loading ? (
                <div className="text-center text-gray-400">Loading messages…</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">No messages yet. Send the first message.</div>
              ) : (
                messages.map(message => (
                  <div key={message._id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{message.senderName}</p>
                        <p className="text-xs text-gray-500">{message.senderRole}</p>
                      </div>
                      <p className="text-xs text-gray-400">{formatDate(message.createdAt)}</p>
                    </div>
                    <p className="mt-3 text-gray-700 whitespace-pre-line">{message.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="space-y-3">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={4}
                className="input w-full resize-none"
                placeholder="Type your message here"
              />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="submit" disabled={!text.trim()}
                  className="btn-primary py-3 disabled:cursor-not-allowed disabled:opacity-60">
                  Send Message
                </button>
                {sendStatus && <span className="text-sm text-gray-500">{sendStatus}</span>}
              </div>
            </form>
          </div>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">Tips for chat</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• Describe symptoms, crop stage, and location clearly.</li>
              <li>• Share photos in the crop help page before messaging.</li>
              <li>• Use simple questions like “What fertilizer should I use?”</li>
              <li>• Specialists will respond as soon as they can.</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
