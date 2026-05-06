# BLOGIFY — Technical Details

This document is derived from the repository’s implementation (`app/`, `app/api/`, `lib/`, `server/`, and `prisma/`). It does **not** assume missing code.

## System architecture (as implemented)

### Runtime app (what `npm run dev` runs)

- **Next.js App Router** renders UI pages from `app/(main)`, `app/(auth)`, and `app/(landing)`.
- **Next.js API Routes** live under `app/api/**/route.ts`.
- **Data storage for APIs** is `lib/store.ts`:
  - global singleton in memory (`global.__store`)
  - optional file persistence to `.data/users.json`, `.data/blogs.json`, `.data/streams.json`
- **WebRTC live streaming**
  - Broadcaster studio: `app/(main)/go-live/[streamId]/page.tsx`
  - Viewer page: `app/(main)/stream/[streamId]/page.tsx`
  - Signaling: `app/api/streams/[streamId]/signal/route.ts` (polling + posting messages)
  - Chat messages stored in the same in-memory store via `app/api/chat/[streamId]/message/route.ts`

### Standalone server (present but not wired into the main workflow)

`server/index.js` defines an Express + Socket.io server with its own REST endpoints (health, auth, users, blogs, streams, comments, search, analytics) and Socket.io events for chat/WebRTC messages. However:

- `package.json` does not define scripts to run this server.
- Express/Socket.io dependencies are not declared in `package.json` (even though the code imports them).
- The Next.js frontend code calls `'/api'` (Next API routes), not this server’s `http://localhost:5000/api`.

## Data flow: creating a blog post (step by step)

This describes what happens in the current code path when a user publishes a blog from the UI.

1. **User signs in**
   - UI: `app/(auth)/login/page.tsx`
   - Request: `POST /api/auth/login` (`app/api/auth/login/route.ts`)
   - Result: `{ user, token }` returned and saved in `localStorage` by `app/contexts/AuthContext.tsx`

2. **User opens the editor**
   - UI: `app/(main)/create/page.tsx`
   - This page redirects to `/login` if the user is not authenticated (based on `AuthContext`).

3. **(Optional) Generate a draft via Groq**
   - UI action: “Generate First Draft”
   - Request: `POST /api/ai/generate-draft` (`app/api/ai/generate-draft/route.ts`)
   - Input payload: `{ topic, category, userId }`
   - Output: `{ title, content, category, imageUrl? }`
   - If `process.env.GROQ_API_KEY` is missing, the endpoint returns a mock/demo response.

4. **(Optional) Improve content**
   - Request: `POST /api/ai/improve` (`app/api/ai/improve/route.ts`)
   - This is a local transformation (no model call).

5. **(Optional) Generate SEO suggestions**
   - Request: `POST /api/ai/seo-suggestions` (`app/api/ai/seo-suggestions/route.ts`)
   - Produces: `improvedTitle`, `metaDescription`, `keywords`, `seoScore`
   - This is also a local helper (no model call).

6. **Publish**
   - UI action: “Publish to World”
   - Request: `POST /api/blogs` (`app/api/blogs/route.ts`)
   - Input payload includes: `title`, `content`, `excerpt`, `authorId`, `published`, `keywords`
   - Server behavior:
     - generates a new id via `generateId()` (`lib/store.ts`)
     - generates a unique-ish slug via `slugify(title, id)`
     - stores the blog in `store.blogs` (in-memory)
     - returns blog JSON (includes author id/username)

7. **Read**
   - UI navigates to `/blog/[slug]`
   - Page fetches `GET /api/blogs/[slug]` (`app/api/blogs/[slug]/route.ts`)
   - API increments view count and returns blog + comments.

## Security measures implemented (and gaps)

### Implemented

- **Input presence checks** in many API routes (e.g., missing required fields returns `400`).
- **Helmet/CORS** exist in `server/index.js` (standalone server only).
- **React escaping** for rendered content by default (standard React behavior).

### Not implemented (important)

Based on the current code:

- **No password hashing** (passwords are stored in plain text in the store).
- **No signed tokens** / JWT verification in Next.js APIs.
- **No authorization checks** for “write” actions (blog create/update/delete, comment, like, stream create/update, chat send).
- **No rate limiting** on API routes.

## Third-party libraries / APIs used (from `package.json` + source imports)

- **Next.js**: app framework (App Router + API routes)
- **React**: UI framework
- **Tailwind CSS**: styling
- **Radix UI**: UI primitives; shadcn-style components in `components/ui/*`
- **Recharts**: charts on `/dashboard`
- **Three.js + @react-three/fiber + @react-three/drei**: animated 3D background (`components/ThreeBackground.tsx`)
- **ai + @ai-sdk/groq**: Groq LLM calls for draft generation (`/api/ai/generate-draft`, `/api/generate-blog`)
- **zod**: validation library (installed; usage depends on components/routes)
- **react-hook-form**: form management (installed; usage depends on components/routes)

## Runtime (non-Prisma) data structures

The Next.js API routes operate on these in-memory entities (see `lib/store.ts`):

- **User**: `id`, `email`, `username`, `fullName?`, `password`, `bio?`, `avatar?`, `createdAt`
- **Blog**: `id`, `title`, `slug`, `content`, `excerpt?`, `authorId`, `authorUsername`, `tags[]`, `views`, `likes`, `published`, `createdAt`, `updatedAt`, `publishedAt?`, `likedBy[]`
- **Comment**: `id`, `blogId`, `content`, `authorId`, `authorUsername`, `createdAt`
- **Stream**: `id`, `title`, `description?`, `authorId`, `authorUsername`, `status`, `viewerCount`, `hlsUrl?`, `createdAt`
- **ChatMessage**: `id`, `streamId`, `content`, `authorId`, `authorUsername`, `createdAt`
- **Signaling**: stored in `global.__signals` + `global.__viewers` for WebRTC polling

## Database schema (Prisma, PostgreSQL)

The following is the complete schema from `prisma/schema.prisma`.

### Datasource + generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Models, fields, and types

#### `User`

- `id` `String` @id @default(cuid())
- `email` `String` @unique
- `username` `String` @unique
- `password` `String`
- `fullName` `String?`
- `avatar` `String?`
- `role` `Role` @default(USER)
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt
- `followersCount` `Int` @default(0)
- `followingCount` `Int` @default(0)

**Relations**

- `blogs` → `Blog[]`
- `comments` → `BlogComment[]`
- `likes` → `ContentLike[]`
- `followers` → `UserFollower[]` (relation name `"Following"`)
- `following` → `UserFollower[]` (relation name `"Follower"`)
- `streams` → `LiveStream[]`
- `streamViewers` → `StreamViewer[]`
- `chatMessages` → `StreamChat[]`
- `aiGenerations` → `AIContentGeneration[]`
- `notifications` → `Notification[]`
- `analytics` → `UserAnalytics?`

#### `Blog`

- `id` `String` @id @default(cuid())
- `title` `String`
- `slug` `String` @unique
- `content` `String` @db.Text
- `excerpt` `String?`
- `coverImage` `String?`
- `authorId` `String`
- `published` `Boolean` @default(false)
- `viewCount` `Int` @default(0)
- `metaTitle` `String?`
- `metaDescription` `String?`
- `keywords` `String[]`
- `publishedAt` `DateTime?`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `author` → `User` (`authorId` → `User.id`, onDelete: Cascade)
- `comments` → `BlogComment[]`
- `likes` → `ContentLike[]`
- `analytics` → `BlogAnalytics?`

**Indexes**

- `@@index([authorId])`
- `@@index([slug])`
- `@@index([published])`

#### `BlogComment`

- `id` `String` @id @default(cuid())
- `content` `String` @db.Text
- `blogId` `String`
- `authorId` `String`
- `parentId` `String?`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `blog` → `Blog` (`blogId` → `Blog.id`, onDelete: Cascade)
- `author` → `User` (`authorId` → `User.id`, onDelete: Cascade)
- `parent` → `BlogComment?` (self relation `"CommentReplies"`)
- `replies` → `BlogComment[]` (self relation `"CommentReplies"`)

**Indexes**

- `@@index([blogId])`
- `@@index([parentId])`

#### `LiveStream`

- `id` `String` @id @default(cuid())
- `title` `String`
- `description` `String?`
- `thumbnail` `String?`
- `hlsUrl` `String?`
- `rtmpUrl` `String?`
- `streamKey` `String?`
- `status` `StreamStatus` @default(OFFLINE)
- `creatorId` `String`
- `recordingUrl` `String?`
- `recordedAt` `DateTime?`
- `startedAt` `DateTime?`
- `endedAt` `DateTime?`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `creator` → `User` (`creatorId` → `User.id`, onDelete: Cascade)
- `viewers` → `StreamViewer[]`
- `chatMessages` → `StreamChat[]`
- `analytics` → `StreamAnalytics?`

**Indexes**

- `@@index([creatorId])`
- `@@index([status])`

#### `StreamViewer`

- `id` `String` @id @default(cuid())
- `streamId` `String`
- `userId` `String?`
- `joinedAt` `DateTime` @default(now())
- `leftAt` `DateTime?`

**Relations**

- `stream` → `LiveStream` (`streamId` → `LiveStream.id`, onDelete: Cascade)
- `user` → `User?` (`userId` → `User.id`, onDelete: SetNull)

**Constraints / indexes**

- `@@unique([streamId, userId])`
- `@@index([streamId])`

#### `StreamChat`

- `id` `String` @id @default(cuid())
- `streamId` `String`
- `userId` `String`
- `message` `String` @db.Text
- `isFlagged` `Boolean` @default(false)
- `createdAt` `DateTime` @default(now())

**Relations**

- `stream` → `LiveStream` (`streamId` → `LiveStream.id`, onDelete: Cascade)
- `user` → `User` (`userId` → `User.id`, onDelete: Cascade)

**Indexes**

- `@@index([streamId])`
- `@@index([userId])`

#### `UserFollower`

- `id` `String` @id @default(cuid())
- `followerId` `String`
- `followingId` `String`
- `createdAt` `DateTime` @default(now())

**Relations**

- `follower` → `User` (relation `"Follower"`, onDelete: Cascade)
- `following` → `User` (relation `"Following"`, onDelete: Cascade)

**Constraints / indexes**

- `@@unique([followerId, followingId])`
- `@@index([followerId])`
- `@@index([followingId])`

#### `ContentLike`

- `id` `String` @id @default(cuid())
- `blogId` `String`
- `userId` `String`
- `createdAt` `DateTime` @default(now())

**Relations**

- `blog` → `Blog` (`blogId` → `Blog.id`, onDelete: Cascade)
- `user` → `User` (`userId` → `User.id`, onDelete: Cascade)

**Constraints / indexes**

- `@@unique([blogId, userId])`
- `@@index([blogId])`

#### `AIContentGeneration`

- `id` `String` @id @default(cuid())
- `userId` `String`
- `type` `AIGenerationType`
- `prompt` `String` @db.Text
- `response` `String` @db.Text
- `model` `String`
- `tokensUsed` `Int?`
- `generationId` `String?` @unique
- `createdAt` `DateTime` @default(now())

**Relations**

- `user` → `User` (`userId` → `User.id`, onDelete: Cascade)

**Indexes**

- `@@index([userId])`

#### `ModerationLog`

- `id` `String` @id @default(cuid())
- `contentId` `String`
- `contentType` `ModerationContentType`
- `category` `ModerationCategory[]`
- `confidence` `Float`
- `severity` `Severity`
- `result` `ModerationResult`
- `reviewerId` `String?`
- `reviewNote` `String?`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Indexes**

- `@@index([contentId])`
- `@@index([contentType])`

#### `UserAnalytics`

- `id` `String` @id @default(cuid())
- `userId` `String` @unique
- `totalViews` `Int` @default(0)
- `totalLikes` `Int` @default(0)
- `totalComments` `Int` @default(0)
- `avgViewsPerDay` `Float` @default(0)
- `engagementRate` `Float` @default(0)
- `periodStart` `DateTime`
- `periodEnd` `DateTime`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `user` → `User` (`userId` → `User.id`, onDelete: Cascade)

**Indexes**

- `@@index([userId])`

#### `BlogAnalytics`

- `id` `String` @id @default(cuid())
- `blogId` `String` @unique
- `views` `Int` @default(0)
- `uniqueViews` `Int` @default(0)
- `avgReadTime` `Float` @default(0)
- `bounceRate` `Float` @default(0)
- `periodStart` `DateTime`
- `periodEnd` `DateTime`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `blog` → `Blog` (`blogId` → `Blog.id`, onDelete: Cascade)

**Indexes**

- `@@index([blogId])`

#### `StreamAnalytics`

- `id` `String` @id @default(cuid())
- `streamId` `String` @unique
- `peakViewers` `Int` @default(0)
- `avgViewers` `Float` @default(0)
- `totalChatMsgs` `Int` @default(0)
- `avgEngagement` `Float` @default(0)
- `periodStart` `DateTime`
- `periodEnd` `DateTime`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Relations**

- `stream` → `LiveStream` (`streamId` → `LiveStream.id`, onDelete: Cascade)

**Indexes**

- `@@index([streamId])`

#### `Recommendation`

- `id` `String` @id @default(cuid())
- `userId` `String`
- `contentId` `String`
- `contentType` `RecommendationType`
- `score` `Float`
- `reason` `String?`
- `createdAt` `DateTime` @default(now())

**Constraints / indexes**

- `@@unique([userId, contentId, contentType])`
- `@@index([userId])`

#### `Notification`

- `id` `String` @id @default(cuid())
- `userId` `String`
- `type` `NotificationType`
- `title` `String`
- `message` `String`
- `data` `Json?`
- `read` `Boolean` @default(false)
- `createdAt` `DateTime` @default(now())

**Relations**

- `user` → `User` (`userId` → `User.id`, onDelete: Cascade)

**Indexes**

- `@@index([userId])`
- `@@index([read])`

#### `Subscription`

- `id` `String` @id @default(cuid())
- `userId` `String` @unique
- `tier` `SubscriptionTier` @default(FREE)
- `stripeCustomerId` `String?`
- `stripeSubId` `String?`
- `expiresAt` `DateTime?`
- `createdAt` `DateTime` @default(now())
- `updatedAt` `DateTime` @updatedAt

**Indexes**

- `@@index([userId])`

### Enums

- `Role`: `USER | CREATOR | ADMIN`
- `StreamStatus`: `OFFLINE | LIVE | ENDED`
- `AIGenerationType`: `DRAFT | IMPROVE | SEO_SUGGESTIONS | HEADLINES | TAGS | EMBEDDING`
- `ModerationContentType`: `BLOG | COMMENT | CHAT`
- `ModerationCategory`: `SPAM | HATE_SPEECH | NSFW | HARASSMENT | VIOLENCE | MISINFORMATION`
- `Severity`: `LOW | MEDIUM | HIGH`
- `ModerationResult`: `FLAGGED | WARNED | SUSPENDED | REMOVED | APPROVED`
- `RecommendationType`: `BLOG | STREAM | USER`
- `NotificationType`: `FOLLOW | LIKE | COMMENT | STREAM_START | STREAM_END | SYSTEM`
- `SubscriptionTier`: `FREE | PRO | PREMIUM`

## Relationships (Prisma schema)

High-level relationship map (from the Prisma schema):

- `User (1) -> (many) Blog` via `Blog.authorId`
- `Blog (1) -> (many) BlogComment` via `BlogComment.blogId`
- `BlogComment (self) -> (many) BlogComment` via `parentId` (nested replies)
- `User (many) <-> (many) User` via join model `UserFollower`
- `User (1) -> (many) LiveStream` via `LiveStream.creatorId`
- `LiveStream (1) -> (many) StreamViewer` via `StreamViewer.streamId`
- `LiveStream (1) -> (many) StreamChat` via `StreamChat.streamId`
- `User (1) -> (many) StreamChat` via `StreamChat.userId`
- `Blog (many) <-> (many) User` via join model `ContentLike`
- `User (1) -> (many) AIContentGeneration` via `AIContentGeneration.userId`
- `User (1) -> (many) Notification` via `Notification.userId`

