// Shared in-memory store for all API routes
// In production this would be replaced with a real database

import fs from 'fs';
import path from 'path';

interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
  password: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  authorId: string;
  authorUsername: string;
  tags: string[];
  views: number;
  likes: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  likedBy: string[];
}

interface Comment {
  id: string;
  blogId: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
}

interface Stream {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  authorUsername: string;
  status: string;
  viewerCount: number;
  hlsUrl?: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  streamId: string;
  content: string;
  authorId: string;
  authorUsername: string;
  createdAt: string;
}

// File-based persistence
const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const STREAMS_FILE = path.join(DATA_DIR, 'streams.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Ensure `.data/` exists on module load (best effort).
try {
  ensureDataDir();
} catch {
  // ignore in restricted/serverless environments
}

function loadFromFile<T>(filePath: string, defaultValue: T[]): T[] {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw) as T[];
    }
  } catch {
    // ignore parse errors, use defaults
  }
  return defaultValue;
}

export function saveUsers() {
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(store.users.values()), null, 2));
  } catch { /* ignore write errors in serverless */ }
}

export function saveBlogs() {
  try {
    ensureDataDir();
    fs.writeFileSync(BLOGS_FILE, JSON.stringify(Array.from(store.blogs.values()), null, 2));
  } catch { /* ignore */ }
}

export function saveStreams() {
  try {
    ensureDataDir();
    fs.writeFileSync(STREAMS_FILE, JSON.stringify(Array.from(store.streams.values()), null, 2));
  } catch { /* ignore */ }
}

// Global singleton pattern for Next.js (survives hot reloads in dev)
declare global {
  var __store: {
    users: Map<string, User>;
    usersByEmail: Map<string, User>;
    usersByUsername: Map<string, User>;
    blogs: Map<string, Blog>;
    comments: Map<string, Comment>;
    streams: Map<string, Stream>;
    chatMessages: Map<string, ChatMessage>;
  } | undefined;
}

const demoUserId = 'demo-user-1';
const demoBlogId = 'demo-blog-1';
const demoStreamId = 'demo-stream-1';

const demoUser: User = {
  id: demoUserId,
  email: 'demo@example.com',
  username: 'demo',
  fullName: 'Demo User',
  password: '$2b$10$IjnVdLq0etG6MeX.kHDraewBiCQpO1kHAX1mD9uDR81ONjzNeESvW',
  bio: 'Content creator and tech enthusiast',
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const demoBlog: Blog = {
  id: demoBlogId,
  title: 'Welcome to BLOGIFY — The Future of Content Creation',
  slug: 'welcome-to-blogify-the-future-of-content-creation',
  content: `# Welcome to BLOGIFY\n\nBLOGIFY is a modern platform for creators and content enthusiasts. Whether you want to write, stream live, or build your audience — we have you covered.\n\n## What You Can Do\n\n### 📝 Write Blogs\nCreate engaging articles with our AI-powered writing assistant. Generate drafts, improve your writing, and optimize for SEO — all with a single click.\n\n### 🎥 Go Live\nStream live to your audience with real-time chat. Engage with your viewers, answer questions, and build a community around your content.\n\n### 📊 Track Analytics\nMonitor your content's performance with detailed analytics. Track views, likes, comments, and follower growth over time.\n\n## Getting Started\n\n1. **Create an account** — Sign up for free to get started\n2. **Write your first blog** — Use our editor to create your first article\n3. **Build your audience** — Share your content and grow your following\n\n## AI-Powered Features\n\nOur AI assistant can help you:\n- **Generate drafts** from a topic or outline\n- **Improve your writing** for clarity and engagement\n- **Optimize for SEO** with keyword suggestions\n- **Generate headlines** for maximum click-through rate\n\nStart creating today and join thousands of creators already on BLOGIFY!`,
  excerpt: 'Discover how BLOGIFY is revolutionizing content creation with AI-powered tools, live streaming, and powerful analytics.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['welcome', 'blogging', 'ai', 'streaming'],
  views: 1247,
  likes: 89,
  published: true,
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog2: Blog = {
  id: 'demo-blog-2',
  title: '10 Tips for Writing Better Blog Posts with AI',
  slug: '10-tips-for-writing-better-blog-posts-with-ai',
  content: `Writing great blog posts consistently can be challenging, especially when you're trying to produce content regularly. That's where AI comes in — not to replace your creativity, but to amplify it.\n\n## 1. Start with a Clear Topic\n\nBefore using any AI tools, know what you want to write about. AI works best when you give it clear, specific prompts.\n\n## 2. Use AI for Brainstorming\n\nAsk your AI assistant for 10 different angles or approaches to your topic. You'll likely find one or two ideas you hadn't considered.\n\n## 3. Generate a Rough Draft\n\nLet AI create a first draft based on your outline. This gives you a starting point to refine and personalize.\n\n## 4. Add Your Personal Voice\n\nThe AI draft is just a starting point. Add your personal experiences, opinions, and examples to make it truly yours.\n\n## 5. Optimize for SEO\n\nUse AI to identify relevant keywords and incorporate them naturally into your content.\n\n## 6. Improve Readability\n\nAsk AI to simplify complex sentences, add transitions, and improve the flow of your writing.\n\n## 7. Generate Multiple Headlines\n\nCreate 5-10 headline variations and pick the most compelling one.\n\n## 8. Create Meta Descriptions\n\nUse AI to write compelling meta descriptions for better click-through rates.\n\n## 9. Fact-Check Everything\n\nAI can make mistakes. Always verify facts, statistics, and claims before publishing.\n\n## 10. Edit with a Human Touch\n\nFinal editing should always be done by you. Ensure the content sounds authentic and aligns with your brand voice.`,
  excerpt: 'Learn how to leverage AI tools to write better, more engaging blog posts faster than ever before.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['writing', 'ai', 'tips', 'productivity'],
  views: 892,
  likes: 56,
  published: true,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoStream: Stream = {
  id: demoStreamId,
  title: 'Live Coding: Building a Real-Time Chat App',
  description: 'Join me as I build a real-time chat application using Next.js, Socket.io, and PostgreSQL. Perfect for beginners and intermediate developers!',
  authorId: demoUserId,
  authorUsername: 'demo',
  status: 'ended',
  viewerCount: 234,
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
};

function isPlainTextPassword(pwd: string): boolean {
  // Empty string means Firebase/social auth user — allow through
  if (!pwd) return false;
  return !pwd.startsWith('$2b$') && !pwd.startsWith('$2a$');
}

if (!global.__store) {
  ensureDataDir();

  // Load persisted users (merge with demo user)
  const persistedUsers = loadFromFile<User>(USERS_FILE, []);
  const usersMap = new Map<string, User>([[demoUserId, demoUser]]);
  const emailMap = new Map<string, User>([['demo@example.com', demoUser]]);
  const usernameMap = new Map<string, User>([['demo', demoUser]]);

  for (const u of persistedUsers) {
    if (!usersMap.has(u.id) && !isPlainTextPassword(u.password)) {
      usersMap.set(u.id, u);
      emailMap.set(u.email.toLowerCase(), u);
      usernameMap.set(u.username.toLowerCase(), u);
    }
  }

  // Load persisted blogs
  const persistedBlogs = loadFromFile<Blog>(BLOGS_FILE, []);
  const blogsMap = new Map<string, Blog>([
    [demoBlogId, demoBlog],
    ['demo-blog-2', demoBlog2],
  ]);
  for (const b of persistedBlogs) {
    if (!blogsMap.has(b.id)) blogsMap.set(b.id, b);
  }

  // Load persisted streams
  const persistedStreams = loadFromFile<Stream>(STREAMS_FILE, []);
  const streamsMap = new Map<string, Stream>([[demoStreamId, demoStream]]);
  for (const s of persistedStreams) {
    if (!streamsMap.has(s.id)) streamsMap.set(s.id, s);
  }

  global.__store = {
    users: usersMap,
    usersByEmail: emailMap,
    usersByUsername: usernameMap,
    blogs: blogsMap,
    comments: new Map(),
    streams: streamsMap,
    chatMessages: new Map(),
  };
}

// Migration: if the store was already initialized by old code (without usersByUsername),
// patch it in so hot-reloads don't crash.
if (!(global.__store as any).usersByUsername) {
  const usernameMap = new Map<string, User>();
  for (const u of (global.__store as any).users.values()) {
    usernameMap.set((u as User).username.toLowerCase(), u as User);
  }
  (global.__store as any).usersByUsername = usernameMap;
}

export const store = global.__store;

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function slugify(text: string, id: string) {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  return `${base}-${id.substring(0, 8)}`;
}


// WebRTC Signaling store
interface SignalMessage {
  id: string;
  streamId: string;
  fromId: string;
  toId: string | 'all';
  type: 'offer' | 'answer' | 'ice-candidate' | 'viewer-joined' | 'broadcaster-ready' | 'stream-ended';
  payload: any;
  createdAt: number;
}

declare global {
  var __signals: Map<string, SignalMessage[]> | undefined;
  var __viewers: Map<string, Set<string>> | undefined; // streamId -> Set of viewerIds
}

if (!global.__signals) global.__signals = new Map();
if (!global.__viewers) global.__viewers = new Map();

export const signals = global.__signals!;
export const viewers = global.__viewers!;

export function addSignal(msg: Omit<SignalMessage, 'id' | 'createdAt'>) {
  const full: SignalMessage = { ...msg, id: generateId(), createdAt: Date.now() };
  const key = msg.streamId;
  if (!signals.has(key)) signals.set(key, []);
  const arr = signals.get(key)!;
  arr.push(full);
  // Keep only last 200 signals
  if (arr.length > 200) arr.splice(0, arr.length - 200);
  return full;
}

export function getSignals(streamId: string, afterTimestamp: number, targetId?: string) {
  const arr = signals.get(streamId) || [];
  return arr.filter(s =>
    s.createdAt > afterTimestamp &&
    (s.toId === 'all' || s.toId === targetId || s.fromId === targetId)
  );
}
