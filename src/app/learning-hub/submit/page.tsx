'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type ContentType = 'video' | 'infographic' | 'guide' | 'tip';
type Category    = 'crop-care' | 'fertilizer' | 'pesticides' | 'cost-reduction' | 'extreme-weather' | 'tips-guides';

const typeOptions: { value: ContentType; label: string; icon: string; desc: string }[] = [
  { value: 'video',       label: 'Video',       icon: '▶️',  desc: 'Share a YouTube video link' },
  { value: 'infographic', label: 'Infographic', icon: '📊',  desc: 'Upload an image or diagram' },
  { value: 'guide',       label: 'Guide',       icon: '📖',  desc: 'Write a step-by-step article' },
  { value: 'tip',         label: 'Quick Tip',   icon: '💡',  desc: 'Share a short practical tip' },
];

const categoryOptions: { value: Category; label: string; icon: string }[] = [
  { value: 'crop-care',      label: 'Crop Care',       icon: '🌱' },
  { value: 'fertilizer',     label: 'Fertilizer',      icon: '🧪' },
  { value: 'pesticides',     label: 'Pesticides',      icon: '🐛' },
  { value: 'cost-reduction', label: 'Cost Reduction',  icon: '💰' },
  { value: 'extreme-weather',label: 'Extreme Weather', icon: '🌧️' },
  { value: 'tips-guides',    label: 'Tips & Guides',   icon: '💡' },
];

export default function SubmitContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep]         = useState<1 | 2>(1);
  const [type, setType]         = useState<ContentType>('video');
  const [category, setCategory] = useState<Category>('crop-care');
  const [title, setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [youtubeId, setYoutubeId]     = useState('');
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [content, setContent]   = useState('');
  const [tags, setTags]         = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [readTime, setReadTime] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  const role = session?.user?.role as string;
  const isPublisher = role === 'admin' || role === 'specialist';

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session || !['admin', 'specialist', 'farmer'].includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center max-w-md w-full">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-500 mb-6">You must be signed in as a farmer, specialist, or admin to submit content.</p>
          <Link href="/login" className="btn-primary">Sign In</Link>
        </div>
      </div>
    );
  }

  function extractYoutubeId(input: string): string {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
    ];
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }
    return input.trim();
  }

  async function uploadImage(file: File): Promise<string> {
    const data = new FormData();
    data.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: data });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Upload failed');
    return json.url as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    if (type === 'video' && !youtubeId.trim()) {
      setError('Please provide a YouTube URL or video ID.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (type === 'infographic' && imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const resolvedYoutubeId = type === 'video' ? extractYoutubeId(youtubeId) : '';
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);

      const res = await fetch('/api/learning-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, type, category,
          youtubeId: resolvedYoutubeId,
          imageUrl,
          content,
          duration,
          readTime,
          tags: tagList,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Submission failed'); return; }

      setMessage(data.message);
      setTimeout(() => router.push('/learning-hub'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-8">

        {/* Header */}
        <div>
          <Link href="/learning-hub" className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 mb-4">
            ← Back to Learning Hub
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Educational Content</h1>
              <p className="text-gray-500 mt-1">
                {isPublisher
                  ? 'Your content will be published immediately as a verified contributor.'
                  : 'Your submission will be reviewed by our admin team before publishing.'}
              </p>
            </div>
            <div className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-bold ${
              isPublisher ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isPublisher ? '✅ Auto-Approved' : '⏳ Pending Review'}
            </div>
          </div>

          {/* Role Info Banner */}
          <div className={`mt-4 rounded-2xl p-4 border text-sm ${
            role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-800' :
            role === 'specialist' ? 'bg-blue-50 border-blue-200 text-blue-800' :
            'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {role === 'admin' && '👑 Admin: Your content is published instantly without review.'}
            {role === 'specialist' && '🔬 Verified Expert: Your content is published instantly as authoritative guidance.'}
            {role === 'farmer' && '🌾 Farmer Submission: Your content will be reviewed by the admin within 24–48 hours. Once approved, it will appear with a "Farmer Contributed" badge.'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1 — Type & Category */}
          <div className="card space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Step 1 — Choose Content Type & Category</h2>

            <div>
              <label className="label">Content Type</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {typeOptions.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setType(opt.value)}
                    className={`p-4 rounded-2xl border-2 text-center transition-all ${
                      type === opt.value ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="text-2xl mb-1">{opt.icon}</div>
                    <div className="text-sm font-bold text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-tight">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryOptions.map(opt => (
                  <button key={opt.value} type="button" onClick={() => setCategory(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      category === opt.value ? 'border-green-500 bg-green-50 text-green-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}>
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2 — Content Details */}
          <div className="card space-y-5">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Step 2 — Content Details</h2>

            <div>
              <label className="label">Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. How to manage rice blast disease" className="input" maxLength={120} />
              <p className="text-xs text-gray-400 mt-1">{title.length}/120 characters</p>
            </div>

            <div>
              <label className="label">Short Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what farmers will learn from this content." rows={3} className="input resize-none" maxLength={300} />
              <p className="text-xs text-gray-400 mt-1">{description.length}/300 characters</p>
            </div>

            {/* Video-specific */}
            {type === 'video' && (
              <div>
                <label className="label">YouTube URL or Video ID *</label>
                <input type="text" value={youtubeId} onChange={e => setYoutubeId(e.target.value)} placeholder="https://youtube.com/watch?v=... or video ID" className="input" />
                <p className="text-xs text-gray-400 mt-1">Paste the full YouTube link or just the video ID (e.g. dQw4w9WgXcQ)</p>
                {youtubeId && (
                  <div className="mt-3 rounded-2xl overflow-hidden aspect-video max-w-sm">
                    <img src={`https://img.youtube.com/vi/${extractYoutubeId(youtubeId)}/hqdefault.jpg`} alt="Video thumbnail" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
                <div className="mt-3">
                  <label className="label">Video Duration (optional)</label>
                  <input type="text" value={duration} onChange={e => setDuration(e.target.value)} placeholder="E.g. 12:30" className="input max-w-[140px]" />
                </div>
              </div>
            )}

            {/* Infographic-specific */}
            {type === 'infographic' && (
              <div>
                <label className="label">Upload Infographic Image</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0] ?? null;
                  setImageFile(file);
                  if (file) setImagePreview(URL.createObjectURL(file));
                }} className="w-full text-sm text-gray-600" />
                {imagePreview && (
                  <div className="mt-3">
                    <img src={imagePreview} alt="Preview" className="rounded-2xl max-h-48 object-contain border border-gray-200" />
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">Upload a clear image or diagram (JPG, PNG, max 5MB)</p>
              </div>
            )}

            {/* Guide / Tip content */}
            {(type === 'guide' || type === 'tip') && (
              <div>
                <label className="label">{type === 'guide' ? 'Full Guide Content' : 'Tip Content'}</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={
                  type === 'guide'
                    ? 'Write your step-by-step guide here. Use line breaks to separate steps.'
                    : 'Write your practical tip here. Be clear and concise.'
                } rows={type === 'guide' ? 10 : 5} className="input resize-none" />
                <div className="mt-3">
                  <label className="label">Estimated Read Time (optional)</label>
                  <input type="text" value={readTime} onChange={e => setReadTime(e.target.value)} placeholder="E.g. 5 min read" className="input max-w-[180px]" />
                </div>
              </div>
            )}

            {/* Shared fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Difficulty Level</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')} className="input">
                  <option value="Beginner">🟢 Beginner</option>
                  <option value="Intermediate">🟡 Intermediate</option>
                  <option value="Advanced">🔴 Advanced</option>
                </select>
              </div>
              <div>
                <label className="label">Tags (optional)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Rice, Flood, Prevention" className="input" />
                <p className="text-xs text-gray-400 mt-1">Separate tags with commas</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {error   && <div className="rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm p-4 font-medium">❌ {error}</div>}
          {message && <div className="rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm p-4 font-medium">✅ {message} Redirecting to Learning Hub...</div>}

          {/* Submit */}
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : isPublisher ? '🚀 Publish Now' : '📤 Submit for Review'}
            </button>
            <Link href="/learning-hub" className="btn-secondary py-3 px-6">Cancel</Link>
          </div>
        </form>

      </div>
    </div>
  );
}
