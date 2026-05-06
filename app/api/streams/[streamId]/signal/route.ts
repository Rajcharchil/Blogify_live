import { NextRequest, NextResponse } from 'next/server';
import { store, addSignal, getSignals, viewers } from '@/lib/store';

type Params = { params: Promise<{ streamId: string }> };

// GET: poll for new signals
export async function GET(req: NextRequest, { params }: Params) {
  const { streamId } = await params;
  const { searchParams } = new URL(req.url);
  const after = parseInt(searchParams.get('after') || '0');
  const viewerId = searchParams.get('viewerId') || '';

  const msgs = getSignals(streamId, after, viewerId);
  
  // Also return current viewer count
  const viewerSet = viewers.get(streamId) || new Set();
  
  return NextResponse.json({ 
    signals: msgs,
    viewerCount: viewerSet.size,
    serverTime: Date.now()
  });
}

// POST: send a signal
export async function POST(req: NextRequest, { params }: Params) {
  const { streamId } = await params;
  const body = await req.json();
  const { type, fromId, toId, payload } = body;

  // Handle viewer tracking
  if (type === 'viewer-joined') {
    if (!viewers.has(streamId)) viewers.set(streamId, new Set());
    viewers.get(streamId)!.add(fromId);
    // Update stream viewer count
    const stream = store.streams.get(streamId);
    if (stream) {
      stream.viewerCount = viewers.get(streamId)!.size;
      store.streams.set(streamId, stream);
    }
  }
  if (type === 'viewer-left') {
    viewers.get(streamId)?.delete(fromId);
    const stream = store.streams.get(streamId);
    if (stream) {
      stream.viewerCount = (viewers.get(streamId) || new Set()).size;
      store.streams.set(streamId, stream);
    }
    return NextResponse.json({ ok: true });
  }
  if (type === 'stream-ended') {
    viewers.delete(streamId);
    const stream = store.streams.get(streamId);
    if (stream) { stream.status = 'ended'; stream.viewerCount = 0; store.streams.set(streamId, stream); }
  }
  if (type === 'broadcaster-ready') {
    const stream = store.streams.get(streamId);
    if (stream) { stream.status = 'live'; store.streams.set(streamId, stream); }
  }

  const signal = addSignal({ streamId, fromId, toId: toId || 'all', type, payload });
  return NextResponse.json({ ok: true, signal });
}
