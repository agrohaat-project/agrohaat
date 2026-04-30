'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';

interface ChatMessage {
  _id: string;
  senderName: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

interface Farmer {
  _id: string;
  name: string;
  email: string;
  location: { district: string; upazila: string };
}

export default function SpecialistMessagesPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">Loading...</div>}>
      <SpecialistMessages />
    </Suspense>
  );
}

function SpecialistMessages() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const selectedFarmerId = searchParams.get('farmerId');

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendStatus, setSendStatus] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const roomId = selectedFarmer ? `farmer-${selectedFarmer._id}` : '';

  // Load farmers list
  useEffect(() => {
    async function loadFarmers() {
      try {
        const response = await fetch('/api/specialist/farmers');
        const data = await response.json();
        setFarmers(data.farmers || []);

        // If farmerId from URL, find and select that farmer
        if (selectedFarmerId && data.farmers) {
          const farmer = data.farmers.find((f: Farmer) => f._id === selectedFarmerId);
          if (farmer) {
            setSelectedFarmer(farmer);
          }
        } else if (data.farmers.length > 0) {
          setSelectedFarmer(data.farmers[0]);
        }
      } catch (error) {
        console.error('Failed to load farmers:', error);
      } finally {
        setLoading(false);
      }
    }
    if (session) loadFarmers();
  }, [session, selectedFarmerId]);

  // Load messages for selected farmer
  useEffect(() => {
    if (!roomId) return;

    let active = true;

    async function loadMessages() {
      try {
        const response = await fetch(`/api/chat?room=${encodeURIComponent(roomId)}`);
        const data = await response.json();
        if (active) {
          setMessages(data.messages || []);
          scrollToBottom();
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }

    loadMessages();
    const interval = setInterval(loadMessages, 2500);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [roomId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!roomId || !text.trim()) return;

    setSendStatus('Sending...');
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomId, text: text.trim() }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send message');

      setText('');
      setSendStatus('Message sent');
      setTimeout(() => setSendStatus(''), 2000);

      // Reload messages
      const messagesResponse = await fetch(`/api/chat?room=${encodeURIComponent(roomId)}`);
      const messagesData = await messagesResponse.json();
      setMessages(messagesData.messages || []);
    } catch (error) {
      setSendStatus(error instanceof Error ? error.message : 'Send failed');
    }
  }

  if (status === 'loading') {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!session?.user) {
    return <div className="text-center py-12 text-gray-500">Please sign in to access messages.</div>;
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading conversations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Farmer Support Messages</h1>
        <p className="mt-2 text-gray-500">Reply to farmer inquiries and provide expert agricultural guidance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Farmers List */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
            <h2 className="font-bold text-lg">👨‍🌾 Farmers</h2>
            <p className="text-xs text-green-50">{farmers.length} conversation(s)</p>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {farmers.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            ) : (
              farmers.map((farmer) => (
                <button
                  key={farmer._id}
                  onClick={() => setSelectedFarmer(farmer)}
                  className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-green-50 transition ${
                    selectedFarmer?._id === farmer._id ? 'bg-green-100 border-l-4 border-l-green-500' : ''
                  }`}
                >
                  <p className="font-semibold text-sm text-gray-900">{farmer.name}</p>
                  <p className="text-xs text-gray-500">{farmer.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    📍 {farmer.location.upazila || farmer.location.district}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {selectedFarmer ? (
            <>
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">Conversation with {selectedFarmer.name}</h2>
                    <p className="text-xs text-blue-50">
                      📧 {selectedFarmer.email} • 📍 {selectedFarmer.location.district}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 min-h-[400px] max-h-[500px] overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-white space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-center">
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`flex ${msg.senderRole === 'specialist' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderRole === 'specialist'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="text-xs font-semibold opacity-75">{msg.senderName}</p>
                        <p className="mt-1">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.senderRole === 'specialist' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatDate(new Date(msg.createdAt))}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSend} className="border-t border-gray-200 p-4 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your expert advice here..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition"
                  >
                    Send
                  </button>
                </div>
                {sendStatus && (
                  <p className="mt-2 text-sm text-gray-600">{sendStatus}</p>
                )}
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-center">
              <p>Select a farmer to start conversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
