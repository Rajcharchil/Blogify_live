'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Send, Users, Eye, Radio, Volume2, VolumeX, Square } from 'lucide-react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function generateViewerId() {
  return `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export default function StreamViewerPage() {
  const params = useParams();
  const streamId = params?.streamId as string;
  const { isAuthenticated, user, token } = useAuth();

  const [stream, setStream] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [streamEnded, setStreamEnded] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [muted, setMuted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [chatError, setChatError] = useState('');

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef(Date.now() - 2000);
  const viewerIdRef = useRef(generateViewerId());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch initial stream data
  useEffect(() => {
    fetch(`/api/streams/${streamId}`)
      .then(r => r.json())
      .then(d => {
        setStream(d);
        setMessages(d.chatMessages || []);
        setIsLive(d.status === 'live' || d.status === 'active');
        setViewerCount(d.viewerCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [streamId]);

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0]) {
        remoteVideoRef.current.srcObject = e.streams[0];
        setHasVideo(true);
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        fetch(`/api/streams/${streamId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ice-candidate',
            fromId: viewerIdRef.current,
            toId: 'broadcaster',
            payload: e.candidate,
          }),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') setHasVideo(true);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setHasVideo(false);
      }
    };

    return pc;
  }, [streamId]);

  // Poll for signals and chat
  const pollAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/streams/${streamId}/signal?after=${lastTimestampRef.current}&viewerId=${viewerIdRef.current}`);
      const data = await res.json();
      lastTimestampRef.current = data.serverTime || Date.now();
      setViewerCount(data.viewerCount || 0);

      for (const sig of data.signals || []) {
        if (sig.fromId === viewerIdRef.current) continue;

        if (sig.type === 'broadcaster-ready') {
          setIsLive(true);
          setStreamEnded(false);
        }

        if (sig.type === 'stream-ended') {
          setIsLive(false);
          setStreamEnded(true);
          setHasVideo(false);
          pcRef.current?.close();
        }

        if (sig.type === 'offer' && sig.toId === viewerIdRef.current) {
          const pc = createPeerConnection();
          await pc.setRemoteDescription(new RTCSessionDescription(sig.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          await fetch(`/api/streams/${streamId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'answer',
              fromId: viewerIdRef.current,
              toId: sig.fromId,
              payload: answer,
            }),
          });
        }

        if (sig.type === 'ice-candidate' && sig.toId === viewerIdRef.current) {
          try {
            if (pcRef.current?.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(sig.payload));
            }
          } catch {}
        }
      }

      // Also fetch latest chat messages
      const streamRes = await fetch(`/api/streams/${streamId}`);
      const streamData = await streamRes.json();
      setMessages(streamData.chatMessages || []);
    } catch {}
  }, [streamId, createPeerConnection]);

  // Join stream
  useEffect(() => {
    if (!streamId) return;

    // Announce viewer joined
    fetch(`/api/streams/${streamId}/signal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'viewer-joined',
        fromId: viewerIdRef.current,
        toId: 'all',
        payload: { username: user?.username || 'Anonymous' },
      }),
    });

    // Start polling
    lastTimestampRef.current = Date.now() - 500;
    pollRef.current = setInterval(pollAll, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      // Announce leave
      fetch(`/api/streams/${streamId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'viewer-left', fromId: viewerIdRef.current, toId: 'all', payload: {} }),
      }).catch(() => {});
      pcRef.current?.close();
    };
  }, [streamId, pollAll, user?.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { setChatError('Please login to chat'); return; }
    if (!newMessage.trim()) return;
    setSubmitting(true);
    setChatError('');
    try {
      const res = await fetch(`/api/chat/${streamId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { ...data, author: { id: user?.id, username: user?.username } }]);
      setNewMessage('');
    } catch (err: any) {
      setChatError('Failed to send');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Connecting to stream...</p>
        </div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 border-slate-700 p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-200 mb-4">Stream not found</p>
          <Link href="/streams"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Browse Streams</Button></Link>
        </Card>
      </div>
    );
  }

  const creator = stream.creator || { username: stream.authorUsername, id: stream.authorId };
  const isCreator = user?.id === creator.id || user?.id === stream.authorId;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Video + Info — left 2/3 */}
          <div className="lg:col-span-2 space-y-4">

            {/* Video Player */}
            <Card className="bg-black border-slate-700 overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={muted}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Overlay when no video */}
                {!hasVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8">
                    {streamEnded ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                          <Square className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-white text-xl font-semibold">Stream Ended</p>
                        <p className="text-slate-400">This stream has ended. Check back later!</p>
                      </>
                    ) : isLive ? (
                      <>
                        <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500/50 flex items-center justify-center animate-pulse">
                          <Radio className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-white text-xl font-semibold">Stream is Live</p>
                        <p className="text-slate-400">Connecting to broadcast...</p>
                        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                          <Radio className="w-8 h-8 text-slate-500" />
                        </div>
                        <p className="text-white text-xl font-semibold">Stream Not Started</p>
                        <p className="text-slate-400">The broadcaster hasn't gone live yet. Stay tuned!</p>
                        {isCreator && (
                          <Link href={`/go-live/${streamId}`}>
                            <Button className="bg-red-600 hover:bg-red-700 text-white mt-2">
                              <Radio className="w-4 h-4 mr-2" /> Go Live Now
                            </Button>
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Live badge */}
                {isLive && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                )}

                {/* Viewer count */}
                {isLive && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 text-white text-xs px-2.5 py-1.5 rounded-lg">
                    <Eye className="w-3.5 h-3.5" /> {viewerCount}
                  </div>
                )}

                {/* Mute button */}
                {hasVideo && (
                  <button
                    onClick={() => setMuted(!muted)}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </Card>

            {/* Stream Info */}
            <Card className="bg-slate-800 border-slate-700 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white">{stream.title}</h1>
                  {stream.description && <p className="text-slate-400 text-sm mt-1">{stream.description}</p>}
                </div>
                {isCreator && !isLive && (
                  <Link href={`/go-live/${streamId}`}>
                    <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 shrink-0">
                      <Radio className="w-4 h-4" /> Go Live
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-5 pb-4 border-b border-slate-700 text-sm">
                <div className={`flex items-center gap-2 ${isLive ? 'text-red-400' : 'text-slate-400'}`}>
                  {isLive && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />}
                  {streamEnded ? 'ENDED' : isLive ? 'LIVE' : stream.status?.toUpperCase()}
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Users className="w-4 h-4" /> {viewerCount} watching
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Send className="w-4 h-4" /> {messages.length} messages
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                    {(creator.username || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{creator.username}</p>
                    <p className="text-xs text-slate-400">Creator</p>
                  </div>
                </div>
                {!isCreator && (
                  <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10">
                    Follow
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* Chat — right 1/3 */}
          <div className="flex flex-col bg-slate-800 border border-slate-700 rounded-xl overflow-hidden" style={{ height: '640px' }}>
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2 shrink-0">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-white text-sm">Live Chat</h2>
              {isLive && <div className="ml-auto flex items-center gap-1.5 text-xs text-red-400"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Live</div>}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 text-sm">No messages yet</p>
                  <p className="text-slate-600 text-xs mt-1">Be the first to say something!</p>
                </div>
              ) : (
                messages.map((msg: any, idx) => (
                  <div key={msg.id || idx} className="group">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-emerald-400 text-xs shrink-0">
                        {msg.author?.username || msg.authorUsername || 'Anon'}
                      </span>
                      <span className="text-slate-600 text-xs">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-200 text-sm mt-0.5 break-words">{msg.content}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            {isAuthenticated ? (
              <form onSubmit={handleSendMessage} className="border-t border-slate-700 p-3 shrink-0">
                {chatError && <p className="text-xs text-red-400 mb-1.5">{chatError}</p>}
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Say something..."
                    className="flex-1 bg-slate-700 border-slate-600 text-white placeholder-slate-500 text-sm h-9"
                    maxLength={300}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={submitting || !newMessage.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 w-9 p-0 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            ) : (
              <div className="border-t border-slate-700 p-3 shrink-0 text-center">
                <p className="text-xs text-slate-500 mb-2">Sign in to join the chat</p>
                <Link href="/login">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8">Sign In</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

