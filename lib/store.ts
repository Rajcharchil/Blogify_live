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

const demoBlog3: Blog = {
  id: 'demo-blog-3',
  title: 'The Complete Guide to Next.js 14 App Router',
  slug: 'the-complete-guide-to-nextjs-14-app-router',
  content: 'The Next.js 14 App Router represents a fundamental shift in how we build React applications.\n\n## Server Components by Default\n\nComponents inside the app directory are React Server Components by default. They render on the server and send only HTML to the client, reducing JavaScript bundle size significantly.\n\n## Simplified Data Fetching\n\nGone are the days of getServerSideProps and getStaticProps. Data fetching is now as simple as making an await fetch() call directly inside your component.\n\n## Streaming and Suspense\n\nNext.js 14 uses React Suspense to stream UI components as they become ready. Show loading states for slow parts while instantly rendering the rest.\n\n## Layouts and Templates\n\nThe App Router introduces nested layouts that persist across route changes without re-rendering. This makes complex UI patterns much simpler to implement.\n\n## Conclusion\n\nThe App Router is the future of Next.js development.',
  excerpt: 'Everything you need to know about App Router, Server Components, and streaming.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['nextjs', 'react', 'webdev'],
  views: 2341,
  likes: 156,
  published: true,
  createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog4: Blog = {
  id: 'demo-blog-4',
  title: 'Building Real-Time Apps with WebRTC',
  slug: 'building-real-time-apps-with-webrtc',
  content: 'WebRTC (Web Real-Time Communication) enables peer-to-peer audio, video, and data sharing directly in the browser without plugins.\n\n## How WebRTC Works\n\nWebRTC uses three main APIs: getUserMedia for camera and microphone access, RTCPeerConnection for peer-to-peer connection, and RTCDataChannel for arbitrary data.\n\n## Signaling Process\n\nBefore two peers can connect, they need to exchange connection information through a signaling server. This involves SDP offers and answers plus ICE candidates.\n\n## STUN and TURN Servers\n\nSTUN servers help peers discover their public IP address. TURN servers relay traffic when direct connection fails due to firewalls or NAT.\n\n## Building a Video Chat\n\nStart with getUserMedia to get local stream, create RTCPeerConnection, add tracks, create and exchange offers/answers through your signaling server, then display remote stream.\n\n## Conclusion\n\nWebRTC is powerful technology for building real-time communication apps entirely in the browser.',
  excerpt: 'Learn how to build peer-to-peer video apps using WebRTC.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['webrtc', 'nodejs', 'realtime'],
  views: 1876,
  likes: 134,
  published: true,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog5: Blog = {
  id: 'demo-blog-5',
  title: 'Mastering TypeScript: Advanced Patterns',
  slug: 'mastering-typescript-advanced-patterns',
  content: 'TypeScript has evolved from a simple type-checker into a powerful language with advanced patterns that can transform how you write code.\n\n## Generic Constraints\n\nGenerics allow you to write reusable code that works with multiple types while maintaining type safety. Use extends to add constraints and ensure type compatibility.\n\n## Mapped Types\n\nMapped types let you create new types based on existing ones. The Partial, Required, Readonly, and Pick utility types are all built using mapped types.\n\n## Conditional Types\n\nConditional types select one of two possible types based on a condition. They enable powerful type-level programming and are used extensively in library definitions.\n\n## Template Literal Types\n\nCombine string literal types using template syntax to create precise string types. Useful for building type-safe event systems and API route definitions.\n\n## Conclusion\n\nMastering these advanced TypeScript patterns will make your code more robust, self-documenting, and maintainable.',
  excerpt: 'Deep dive into generics, mapped types, and conditional types.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['typescript', 'javascript'],
  views: 3102,
  likes: 201,
  published: true,
  createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog6: Blog = {
  id: 'demo-blog-6',
  title: 'Startup Lessons: Building My First SaaS',
  slug: 'startup-lessons-building-my-first-saas',
  content: 'Building a SaaS from scratch taught me more than any course or tutorial ever could. Here are the raw lessons from reaching our first 1000 users.\n\n## Lesson 1: Ship Before You Are Ready\n\nI spent three months perfecting features nobody asked for. Ship early, get feedback, iterate. Done is better than perfect.\n\n## Lesson 2: Talk to Your Users\n\nEvery week I did at least five customer calls. This direct feedback shaped the entire product roadmap and saved months of wasted development.\n\n## Lesson 3: Pricing Is a Feature\n\nI underpriced initially out of fear. Raising prices actually increased signups because it signaled quality and attracted serious customers.\n\n## Lesson 4: Marketing From Day One\n\nBuilding in public on Twitter and writing technical blog posts drove more signups than any paid ad campaign. Start building your audience before you launch.\n\n## Lesson 5: Focus on Retention\n\nAcquisition is vanity, retention is sanity. One user who stays for a year is worth more than ten who leave after a week.\n\n## Conclusion\n\nBuilding a SaaS is a marathon. Stay consistent, listen to users, and keep shipping.',
  excerpt: 'Raw and honest lessons from building a SaaS to 1000 users.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['startup', 'saas', 'entrepreneurship'],
  views: 4521,
  likes: 312,
  published: true,
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog7: Blog = {
  id: 'demo-blog-7',
  title: 'UI Design Secrets: Beautiful Dark Mode Interfaces',
  slug: 'ui-design-secrets-beautiful-dark-mode-interfaces',
  content: 'Dark mode is more than just inverting colors. Done well it reduces eye strain and looks stunning. Here are the principles behind beautiful dark interfaces.\n\n## Color Theory for Dark Mode\n\nAvoid pure black backgrounds. Use dark grays like 0a0a0f or 0d1117 as base colors. They feel softer and show elevation better than pure black.\n\n## Elevation Through Color\n\nIn dark mode, lighter surfaces appear higher. Use slightly lighter background values to show hierarchy: base, surface, overlay, modal.\n\n## The Glassmorphism Effect\n\nbackground rgba with low opacity plus backdrop-filter blur creates a stunning frosted glass effect. Use sparingly for cards and modals.\n\n## Typography in Dark Mode\n\nNever use pure white text on dark backgrounds. Use off-white like rgba 255 255 255 0.87 for primary text and rgba 255 255 255 0.5 for secondary text.\n\n## Color Accents\n\nSaturated accent colors pop beautifully against dark backgrounds. Emerald green, indigo, and cyan are particularly effective for CTAs and highlights.\n\n## Conclusion\n\nGreat dark mode design requires understanding light, shadow, and color in a completely different way than light mode.',
  excerpt: 'Colors, contrast, shadows and glassmorphism for dark mode.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['design', 'ui', 'darkmode'],
  views: 1654,
  likes: 98,
  published: true,
  createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  likedBy: [],
};

const demoBlog8: Blog = {
  id: 'demo-blog-8',
  title: 'AI Tools Every Developer Should Know in 2024',
  slug: 'ai-tools-every-developer-should-know-in-2024',
  content: 'AI tools are transforming software development at an incredible pace. Here are the essential tools every developer should have in their workflow.\n\n## GitHub Copilot\n\nThe original AI coding assistant. Trained on billions of lines of code, it suggests completions, writes entire functions, and explains existing code. Essential for daily development.\n\n## Claude by Anthropic\n\nExcels at complex reasoning, code review, and architecture decisions. Particularly strong at explaining why code works a certain way and suggesting improvements.\n\n## Cursor IDE\n\nAn AI-first code editor built on VS Code. The composer feature lets you describe changes in plain English and applies them across multiple files simultaneously.\n\n## v0 by Vercel\n\nGenerates React components and full UI screens from text descriptions. Dramatically speeds up frontend development and prototyping.\n\n## Perplexity AI\n\nAI-powered search that cites sources. Perfect for researching new technologies, finding documentation, and staying up to date with the ecosystem.\n\n## Conclusion\n\nThese tools do not replace developers. They amplify productivity so you can focus on architecture, product thinking, and the creative aspects of building software.',
  excerpt: 'From GitHub Copilot to Claude — tools transforming development.',
  authorId: demoUserId,
  authorUsername: 'demo',
  tags: ['ai', 'tools', 'productivity'],
  views: 5231,
  likes: 423,
  published: true,
  createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  publishedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
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
    ['demo-blog-3', demoBlog3],
    ['demo-blog-4', demoBlog4],
    ['demo-blog-5', demoBlog5],
    ['demo-blog-6', demoBlog6],
    ['demo-blog-7', demoBlog7],
    ['demo-blog-8', demoBlog8],
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
  return arr.filter(s => {
    if (s.createdAt <= afterTimestamp) return false;
    if (!targetId) return true;
    return (
      s.toId === 'all' || 
      s.toId === targetId || 
      s.fromId === targetId
    );
  });
}
