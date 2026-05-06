import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('[v0] Starting BLOGIFY server...');

// Initialize Express and HTTP server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store for in-memory data (demo mode)
const inMemoryStore = {
  users: new Map(),
  blogs: new Map(),
  streams: new Map(),
  comments: new Map(),
};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('[v0] Socket.io client connected:', socket.id);

  socket.on('join-stream', (streamId) => {
    socket.join(`stream-${streamId}`);
    console.log(`[v0] User joined stream: ${streamId}`);
    io.to(`stream-${streamId}`).emit('viewer-joined', { streamId, viewerId: socket.id });
  });

  socket.on('leave-stream', (streamId) => {
    socket.leave(`stream-${streamId}`);
    console.log(`[v0] User left stream: ${streamId}`);
    io.to(`stream-${streamId}`).emit('viewer-left', { streamId, viewerId: socket.id });
  });

  socket.on('chat-message', (data) => {
    const message = {
      id: Date.now().toString(),
      userId: data.userId,
      username: data.username,
      content: data.content,
      streamId: data.streamId,
      timestamp: new Date().toISOString(),
    };
    io.to(`stream-${data.streamId}`).emit('new-message', message);
  });

  socket.on('webrtc-offer', (data) => {
    io.to(`stream-${data.streamId}`).emit('webrtc-offer', data);
  });

  socket.on('webrtc-answer', (data) => {
    io.to(`stream-${data.streamId}`).emit('webrtc-answer', data);
  });

  socket.on('webrtc-ice-candidate', (data) => {
    io.to(`stream-${data.streamId}`).emit('webrtc-ice-candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('[v0] Socket.io client disconnected:', socket.id);
  });
});

// ============ API Routes ============

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), mode: 'demo' });
});

// Auth endpoints (mock)
app.post('/api/auth/register', (req, res) => {
  const { email, username, password, fullName } = req.body;
  
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const userId = Date.now().toString();
  const user = {
    id: userId,
    email: email.toLowerCase(),
    username: username.toLowerCase(),
    fullName: fullName || null,
    avatar: null,
    bio: null,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.users.set(userId, user);

  const token = Buffer.from(JSON.stringify({ userId, email })).toString('base64');

  return res.status(201).json({
    user: { id: user.id, email: user.email, username: user.username },
    token,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  // Find user by email (case-insensitive)
  const user = Array.from(inMemoryStore.users.values()).find(
    u => u.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    // For demo/ease of use, create a user if they don't exist
    const userId = Date.now().toString();
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      username: email.split('@')[0].toLowerCase(),
      fullName: null,
      avatar: null,
      bio: 'New user joined Blogify!',
      createdAt: new Date().toISOString(),
    };
    inMemoryStore.users.set(userId, newUser);
    
    console.log(`[v0] Auto-registered new user: ${newUser.username}`);
    
    const token = Buffer.from(JSON.stringify({ userId: newUser.id, email: newUser.email })).toString('base64');
    return res.json({ user: newUser, token });
  }

  const token = Buffer.from(JSON.stringify({ userId: user.id, email: user.email })).toString('base64');

  return res.json({
    user: { id: user.id, email: user.email, username: user.username },
    token,
  });
});

app.get('/api/users/profile/:username', (req, res) => {
  const username = req.params.username.toLowerCase();
  const user = Array.from(inMemoryStore.users.values()).find(
    u => u.username.toLowerCase() === username
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get user's blogs and streams
  const userBlogs = Array.from(inMemoryStore.blogs.values()).filter(b => b.authorId === user.id);
  const userStreams = Array.from(inMemoryStore.streams.values()).filter(s => s.authorId === user.id);
  
  // Get stats
  const totalViews = userBlogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = userBlogs.reduce((sum, b) => sum + (b.likes || 0), 0);

  res.json({
    user,
    blogs: userBlogs,
    streams: userStreams,
    stats: {
      totalBlogs: userBlogs.length,
      totalViews,
      totalLikes,
      totalStreams: userStreams.length,
    }
  });
});

// Users endpoints
app.get('/api/users/:userId', (req, res) => {
  const user = inMemoryStore.users.get(req.params.userId) || {
    id: req.params.userId,
    username: `user_${req.params.userId}`,
    email: `user@example.com`,
    fullName: 'Demo User',
    avatar: null,
    bio: 'This is a demo user',
  };
  res.json(user);
});

app.put('/api/users/:userId', (req, res) => {
  const user = inMemoryStore.users.get(req.params.userId) || {
    id: req.params.userId,
    ...req.body,
  };
  inMemoryStore.users.set(req.params.userId, user);
  res.json(user);
});

// Blogs endpoints
app.get('/api/blogs', (req, res) => {
  const blogs = Array.from(inMemoryStore.blogs.values()).map(blog => ({
    ...blog,
    author: inMemoryStore.users.get(blog.authorId) || { id: blog.authorId, username: 'Anonymous' },
  }));
  res.json({ blogs, total: blogs.length });
});

app.post('/api/blogs', (req, res) => {
  const { title, content, authorId, tags, image } = req.body;
  
  if (!title || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const blogId = Date.now().toString();
  const blog = {
    id: blogId,
    title,
    content: content || '',
    slug: title.toLowerCase().replace(/\s+/g, '-') + '-' + blogId,
    authorId,
    tags: tags || [],
    image: image || null,
    likes: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  inMemoryStore.blogs.set(blogId, blog);
  res.status(201).json(blog);
});

app.get('/api/blogs/:slug', (req, res) => {
  const blog = Array.from(inMemoryStore.blogs.values()).find(b => b.slug === req.params.slug) || {
    id: Date.now().toString(),
    title: 'Demo Blog',
    content: 'This is a demo blog post',
    slug: req.params.slug,
    authorId: '1',
    tags: ['demo'],
    views: Math.floor(Math.random() * 1000),
    likes: Math.floor(Math.random() * 500),
    createdAt: new Date().toISOString(),
  };
  
  res.json(blog);
});

app.put('/api/blogs/:blogId', (req, res) => {
  const blog = inMemoryStore.blogs.get(req.params.blogId);
  if (!blog) {
    return res.status(404).json({ error: 'Blog not found' });
  }

  const updated = { ...blog, ...req.body, updatedAt: new Date().toISOString() };
  inMemoryStore.blogs.set(req.params.blogId, updated);
  res.json(updated);
});

app.delete('/api/blogs/:blogId', (req, res) => {
  inMemoryStore.blogs.delete(req.params.blogId);
  res.json({ success: true });
});

// Streams endpoints
app.get('/api/streams', (req, res) => {
  const streams = Array.from(inMemoryStore.streams.values());
  res.json({ streams, total: streams.length });
});

app.post('/api/streams', (req, res) => {
  const { title, authorId } = req.body;
  
  if (!title || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const streamId = Date.now().toString();
  const stream = {
    id: streamId,
    title,
    authorId,
    status: 'scheduled',
    viewerCount: 0,
    recordingUrl: null,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.streams.set(streamId, stream);
  res.status(201).json(stream);
});

app.get('/api/streams/:streamId', (req, res) => {
  const stream = inMemoryStore.streams.get(req.params.streamId) || {
    id: req.params.streamId,
    title: 'Demo Stream',
    authorId: '1',
    status: 'active',
    viewerCount: Math.floor(Math.random() * 1000),
    createdAt: new Date().toISOString(),
  };
  res.json(stream);
});

// Comments endpoints
app.get('/api/blogs/:blogId/comments', (req, res) => {
  const comments = Array.from(inMemoryStore.comments.values()).filter(
    c => c.blogId === req.params.blogId
  );
  res.json({ comments, total: comments.length });
});

app.post('/api/blogs/:blogId/comments', (req, res) => {
  const { content, authorId } = req.body;
  
  if (!content || !authorId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const commentId = Date.now().toString();
  const comment = {
    id: commentId,
    blogId: req.params.blogId,
    content,
    authorId,
    likes: 0,
    createdAt: new Date().toISOString(),
  };

  inMemoryStore.comments.set(commentId, comment);
  res.status(201).json(comment);
});

// Search endpoint
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const blogs = Array.from(inMemoryStore.blogs.values()).filter(blog =>
    blog.title.toLowerCase().includes(query.toLowerCase()) ||
    (blog.content && blog.content.toLowerCase().includes(query.toLowerCase()))
  );
  res.json({ results: blogs, total: blogs.length });
});

// Analytics endpoints
app.get('/api/analytics/dashboard/:userId', (req, res) => {
  const userBlogs = Array.from(inMemoryStore.blogs.values()).filter(b => b.authorId === req.params.userId);
  const totalViews = userBlogs.reduce((sum, b) => sum + (b.views || 0), 0);
  const totalLikes = userBlogs.reduce((sum, b) => sum + (b.likes || 0), 0);

  res.json({
    stats: {
      totalBlogs: userBlogs.length,
      totalViews,
      totalLikes,
      followers: 0,
      engagementRate: userBlogs.length > 0 ? (totalLikes / totalViews * 100).toFixed(2) : 0,
    },
    recentBlogs: userBlogs.slice(-5),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[v0] Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`[v0] Server running on port ${PORT}`);
  console.log(`[v0] API available at http://localhost:${PORT}/api`);
  console.log(`[v0] Socket.io ready for real-time features`);
  console.log(`[v0] Running in DEMO MODE - using in-memory storage`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[v0] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    process.exit(0);
  });
});

export { app, httpServer, io };
