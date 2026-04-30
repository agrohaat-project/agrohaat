'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDate } from '@/lib/utils';

interface Report {
  _id: string;
  title: string;
  description: string;
  images: string[];
  status: string;
  createdAt: string;
}

interface DiseaseResult {
  crop: string;
  disease: string;
  confidence: number;
  suggestion: string;
}

export default function CropHelpPage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [aiResult, setAiResult] = useState<DiseaseResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    loadReports();
  }, [session]);

  async function loadReports() {
    setLoading(true);
    const response = await fetch(`/api/reports?farmerId=${session?.user.id}`);
    const data = await response.json();
    setReports(data.reports ?? []);
    setLoading(false);
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeImage(file: File) {
    setAiLoading(true);
    setAiResult(null);
    setAiError('');
    try {
      const imageBase64 = await fileToBase64(file);
      const response = await fetch('/api/detect-disease', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType: file.type }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');
      setAiResult(data);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'Could not analyze image');
    } finally {
      setAiLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []).slice(0, 4);
    setFiles(selected);
    setAiResult(null);
    setAiError('');
    if (selected.length > 0) analyzeImage(selected[0]);
  }

  async function uploadFile(file: File) {
    const data = new FormData();
    data.append('file', file);
    const response = await fetch('/api/upload', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Upload failed');
    return result.url as string;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (!title.trim() || !description.trim()) {
      setMessage('Please add a title and description.');
      return;
    }
    if (!session?.user?.id) {
      setMessage('Please sign in to submit a report.');
      return;
    }
    setLoading(true);
    try {
      const imageUrls = [] as string[];
      for (const file of files) {
        const url = await uploadFile(file);
        imageUrls.push(url);
      }
      const submission = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, images: imageUrls }),
      });
      const data = await submission.json();
      if (!submission.ok) throw new Error(data.error || 'Could not submit report');
      setTitle('');
      setDescription('');
      setFiles([]);
      setAiResult(null);
      setMessage('✅ Report submitted. A specialist will review your crop issue shortly.');
      loadReports();
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Crop Health Support</h1>
          <p className="text-gray-500 mt-2">Upload images and describe your crop issue so specialists can help you faster.</p>
        </div>
        <div className="rounded-3xl bg-green-700 text-white p-5 shadow-lg max-w-sm">
          <h2 className="text-lg font-semibold">Need urgent help?</h2>
          <p className="text-sm leading-relaxed mt-2">Use the live chat panel to ask specialists directly and share updates in real time.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <label className="label">Issue Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g. Rice leaf spots and yellowing"
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Describe the problem</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder="Explain which field, crop stage, and symptoms you are seeing."
              className="input min-h-[180px] w-full resize-none"
            />
          </div>
          <div>
            <label className="label">Upload images</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full text-sm text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-2">You can upload up to 4 photos. The first image will be analyzed by AI automatically.</p>

            {files.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {files.map((file, i) => (
                  <img
                    key={i}
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${i + 1}`}
                    className="h-32 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}

            {aiLoading && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <svg className="animate-spin h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing image with AI...
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="mt-4 rounded-2xl border border-green-400 bg-green-50 p-4 text-sm">
                <p className="font-semibold text-green-800 mb-1">🤖 AI Analysis Result</p>
                <p className="text-green-900 leading-relaxed">
                  🌿 <strong>Detected:</strong> {aiResult.crop} &mdash; <strong>Possible issue:</strong> {aiResult.disease} ({aiResult.confidence}% confidence) &mdash; <strong>Suggestion:</strong> {aiResult.suggestion}
                </p>
                <p className="mt-2 text-xs text-green-700">This is an AI suggestion only. You can edit the title and description above based on these findings.</p>
              </div>
            )}

            {aiError && !aiLoading && (
              <p className="mt-3 text-sm text-red-500">AI analysis unavailable: {aiError}</p>
            )}
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? 'Submitting...' : 'Submit Crop Issue'}
          </button>
          {message && <p className="text-sm text-gray-600">{message}</p>}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Report Checklist</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>• Add clear symptom details and plant stage.</li>
              <li>• Upload photos showing the affected area.</li>
              <li>• Mention recent weather, fertilizer and pest control steps.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-3">Live support</h2>
            <p className="text-sm text-gray-600">After submission, visit the chat page to follow up with a specialist or send more details.</p>
            <a href="/chat" className="inline-flex items-center justify-center rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 transition">Open Chat</a>
          </div>
        </div>
      </form>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Reports</h2>
            <p className="text-gray-500">View your previous crop health submissions.</p>
          </div>
        </div>
        {loading && !reports.length ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-gray-500">No reports yet. Submit your first crop issue above.</div>
        ) : (
          <div className="grid gap-4">
            {reports.map(report => (
              <div key={report._id} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500">Submitted {formatDate(report.createdAt)}</p>
                  </div>
                  <span className={`badge text-sm ${
                    report.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    report.status === 'answered' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>{report.status}</span>
                </div>
                <p className="mt-4 text-gray-600 whitespace-pre-line">{report.description}</p>
                {report.images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {report.images.map(url => (
                      <img key={url} src={url} alt="Crop issue" className="h-40 w-full rounded-2xl object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
