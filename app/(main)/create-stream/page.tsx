'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Radio, Camera, Mic, Wifi } from 'lucide-react';
import Link from 'next/link';

export default function CreateStreamPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center max-w-md w-full">
          <Radio className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to Go Live</h2>
          <p className="text-slate-400 mb-6">Create an account to start live streaming to your audience.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login"><Button variant="outline" className="border-slate-600 text-slate-300">Log In</Button></Link>
            <Link href="/register"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Sign Up Free</Button></Link>
          </div>
        </Card>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Stream title is required'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create stream');
      // Go directly to the broadcaster studio
      router.push(`/go-live/${data.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
            <Radio className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Go Live</h1>
          <p className="text-slate-400">Stream live to your audience with camera & microphone</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Camera, label: 'Camera', desc: 'HD video' },
            { icon: Mic, label: 'Microphone', desc: 'Clear audio' },
            { icon: Wifi, label: 'Real-time', desc: 'WebRTC P2P' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-center">
              <Icon className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-white text-xs font-semibold">{label}</p>
              <p className="text-slate-500 text-xs">{desc}</p>
            </div>
          ))}
        </div>

        <Card className="bg-slate-800 border-slate-700 p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">
                Stream Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What are you streaming today?"
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                maxLength={100}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Description <span className="text-slate-500">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Tell viewers what to expect..."
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 resize-none text-sm"
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300 mb-2">Before you go live:</p>
              <p>• Your browser will ask for camera & microphone access</p>
              <p>• Make sure you're in a well-lit area</p>
              <p>• Test your audio before starting</p>
              <p>• Viewers can join instantly via the stream link</p>
            </div>

            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-base gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Setting up...</>
              ) : (
                <><Radio className="w-4 h-4" /> Continue to Studio</>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
