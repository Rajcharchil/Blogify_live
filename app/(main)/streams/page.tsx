'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Radio, Eye, Plus } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function StreamsPage() {
  const { isAuthenticated } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch_ = () => {
      fetch('/api/streams')
        .then(r => r.json())
        .then(d => { setStreams(d.streams || []); setLoading(false); })
        .catch(() => setLoading(false));
    };
    fetch_();
    // Refresh every 10s to catch new live streams
    const interval = setInterval(fetch_, 10000);
    return () => clearInterval(interval);
  }, []);

  const liveStreams = streams.filter(s => s.status === 'live' || s.status === 'active');
  const otherStreams = streams.filter(s => s.status !== 'live' && s.status !== 'active');

  const StreamCard = ({ stream }: { stream: any }) => {
    const isLive = stream.status === 'live' || stream.status === 'active';
    return (
      <Link href={`/stream/${stream.id}`}>
        <Card className={`bg-slate-800 overflow-hidden group hover:border-slate-500 transition-all cursor-pointer ${isLive ? 'border-red-500/50' : 'border-slate-700'}`}>
          {/* Thumbnail */}
          <div className="aspect-video bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
            <Radio className={`w-10 h-10 ${isLive ? 'text-red-400' : 'text-slate-600'}`} />
            {isLive && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
              </div>
            )}
            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
              <Eye className="w-3 h-3" /> {stream.viewerCount || 0}
            </div>
          </div>
          {/* Info */}
          <div className="p-4">
            <h3 className="font-bold text-white text-sm mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
              {stream.title}
            </h3>
            {stream.description && (
              <p className="text-slate-500 text-xs mb-3 line-clamp-1">{stream.description}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                  {(stream.authorUsername || 'A')[0].toUpperCase()}
                </div>
                <span className="text-slate-400 text-xs">{stream.authorUsername}</span>
              </div>
              <span className={`text-xs font-medium ${isLive ? 'text-red-400' : 'text-slate-500'}`}>
                {isLive ? 'Watching now' : stream.status === 'ended' ? 'Ended' : 'Scheduled'}
              </span>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-1">Live Streams</h1>
            <p className="text-slate-400">
              {liveStreams.length > 0
                ? `${liveStreams.length} stream${liveStreams.length > 1 ? 's' : ''} live right now`
                : 'Watch creators go live and join the conversation'}
            </p>
          </div>
          {isAuthenticated && (
            <Link href="/create-stream">
              <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                <Radio className="w-4 h-4" /> Go Live
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-slate-800 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-video bg-slate-700" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : streams.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
              <Radio className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No streams yet</h3>
            <p className="text-slate-400 mb-6">Be the first to go live on BLOGIFY!</p>
            {isAuthenticated ? (
              <Link href="/create-stream">
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Radio className="w-4 h-4" /> Start Streaming
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Join BLOGIFY</Button>
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Live now section */}
            {liveStreams.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <h2 className="text-lg font-semibold text-white">Live Now</h2>
                  <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">{liveStreams.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {liveStreams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              </div>
            )}

            {/* Other streams */}
            {otherStreams.length > 0 && (
              <div>
                {liveStreams.length > 0 && (
                  <h2 className="text-lg font-semibold text-white mb-4">Recent Streams</h2>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {otherStreams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
