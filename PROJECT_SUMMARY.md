# BLOGIFY — Project Summary

This summary is generated from the repository’s current source code (`app/`, `app/api/`, `lib/`, `server/`, and `prisma/`). It describes what is **actually implemented**, without assuming missing modules.

## What problem does this project solve?

BLOGIFY provides a single web application where creators can write and publish blog posts, optionally use AI assistance to draft content, and stream live to viewers using a lightweight WebRTC workflow. Readers/viewers can browse published content and join live streams with chat.

## Who are the target users?

- **Creators**: users who write articles and host streams.
- **Readers/Viewers**: users who browse posts and watch live streams.

## How does the authentication work?

Authentication is a **demo implementation** built on Next.js API routes and client-side storage:

- **Register** (`POST /api/auth/register`)
  - creates a user in the in-memory store (`lib/store.ts`)
  - persists users to `.data/users.json` via `saveUsers()`
  - returns `{ user, token }` where `token` is `base64(JSON.stringify({ id, email }))`
- **Login** (`POST /api/auth/login`)
  - finds a user by email and compares the provided password to the stored plain-text password
  - returns `{ user, token }` in the same base64 format
- **Client session storage**: `app/contexts/AuthContext.tsx` saves `token` and `user` in `localStorage`

There is **no server-side middleware** that verifies the token for protected routes, and most APIs trust `authorId`/`userId` values sent by the client.

## How is data stored and managed?

### Runtime storage used by the Next.js app

The Next.js API routes use a global, in-memory singleton store implemented in `lib/store.ts`:

- `store.users`, `store.blogs`, `store.comments`, `store.streams`, `store.chatMessages`
- `store.usersByEmail`, `store.usersByUsername` index maps

This store can persist to disk under `.data/`:

- `.data/users.json`
- `.data/blogs.json`
- `.data/streams.json`

The store loads persisted data on initialization and also seeds demo data (`demo@example.com`, sample blogs, sample stream).

### Database schema present in the repo

`prisma/schema.prisma` defines a PostgreSQL schema (Prisma models like `User`, `Blog`, `BlogComment`, `LiveStream`, analytics tables, notifications, etc.). However, the current Next.js API routes do **not** use Prisma in their implementations.

## What are the main modules/components?

- **UI pages (App Router)**: `app/(main)/*`, `app/(auth)/*`, `app/(landing)/*`
- **API routes (App Router)**: `app/api/**/route.ts`
- **Auth state**: `app/contexts/AuthContext.tsx`
- **Store + persistence + signaling**: `lib/store.ts`
- **Shared UI components**: `components/*` and `components/ui/*`
- **WebRTC studio/viewer**:
  - Broadcaster: `app/(main)/go-live/[streamId]/page.tsx`
  - Viewer: `app/(main)/stream/[streamId]/page.tsx`
  - Signaling API: `app/api/streams/[streamId]/signal/route.ts`

## Limitations of the current system

- **Demo-only auth**:
  - passwords are stored in plain text
  - token is Base64 JSON, not signed, no expiry
  - API routes do not verify the token
- **No ownership checks**:
  - most write endpoints trust `authorId`/`userId` in the request body
- **UI/API mismatch for likes**:
  - blog detail page posts likes to `/api/blogs/${blog.id}/like`
  - implemented route is `/api/blogs/[slug]/like`
  - there are directories under `app/api/blogs/[id]/...` but no `route.ts` files there
- **Persistence is partial**:
  - users are persisted on register/update
  - blogs/streams have save helpers, but routes do not consistently call `saveBlogs()` / `saveStreams()`
- **Prisma schema not connected**:
  - schema is present but not used by Next.js API routes
- **Standalone Express server not integrated**:
  - `server/index.js` exists (Express + Socket.io) but `package.json` does not define scripts for it and its dependencies are not declared there
- **Missing page referenced by UI**:
  - the editor redirects to `/drafts`, but no `app/(main)/drafts/page.tsx` exists

## Future improvements

Grounded in the current codebase direction:

- **Integrate Prisma** into Next.js API routes and use `prisma/schema.prisma` as the source of truth.
- **Replace demo auth** with a real authentication mechanism (hashing + signed tokens or server sessions) and enforce authorization in write endpoints.
- **Fix route consistency** (either implement `app/api/blogs/[id]/like/route.ts` or update the UI to use slug).
- **Improve WebRTC robustness**:
  - auth/permissions for broadcaster vs viewers
  - signaling cleanup, viewer tracking improvements
  - better reconnect behavior and error handling
- **Add missing screens** (e.g., draft management screen if `/drafts` is intended).

## Every page/screen and what it does

- **`/`** (`app/(main)/page.tsx`)
  - Authenticated: welcome section + “latest from the community” (fetches `/api/blogs?published=true`)
  - Guest fallback: shows a “redirecting” style screen (the main visitor experience is in `/index`)

- **`/index`** (`app/(landing)/index/page.tsx`)
  - Marketing landing page (hero, features, CTA)

- **`/login`** (`app/(auth)/login/page.tsx`)
  - Login form; calls `POST /api/auth/login`

- **`/register`** (`app/(auth)/register/page.tsx`)
  - Registration form; calls `POST /api/auth/register`

- **`/blog`** (`app/(main)/blog/page.tsx`)
  - Browse/search published blogs (query param `q`); calls `/api/blogs?...&published=true`

- **`/blog/[slug]`** (`app/(main)/blog/[slug]/page.tsx`)
  - Read a blog post; calls `GET /api/blogs/[slug]` (increments views)
  - Comment UI; calls `POST /api/blogs/[id]/comments` (works because comments route accepts slug-or-id)
  - Like UI; calls `POST /api/blogs/[id]/like` (mismatch with implemented like endpoint)

- **`/create`** (`app/(main)/create/page.tsx`)
  - Blog editor with AI actions:
    - draft generation: `POST /api/ai/generate-draft`
    - improve: `POST /api/ai/improve`
    - SEO suggestions: `POST /api/ai/seo-suggestions`
  - Publish/draft save: `POST /api/blogs`

- **`/dashboard`** (`app/(main)/dashboard/page.tsx`)
  - Creator dashboard; fetches `GET /api/analytics/creator/[userId]/dashboard`
  - Shows stat cards, charts, recent blogs, recent streams

- **`/profile/[username]`** (`app/(main)/profile/[username]/page.tsx`)
  - Public profile + tabs for articles and streams
  - Fetches `GET /api/users/profile/[username]`

- **`/streams`** (`app/(main)/streams/page.tsx`)
  - Browse streams (polls `GET /api/streams` every 10 seconds)

- **`/stream/[streamId]`** (`app/(main)/stream/[streamId]/page.tsx`)
  - Viewer page:
    - fetches stream info: `GET /api/streams/[streamId]`
    - polls signaling: `GET /api/streams/[streamId]/signal`
    - posts ICE candidates/answers: `POST /api/streams/[streamId]/signal`
  - Chat:
    - sends message: `POST /api/chat/[streamId]/message`
    - refreshes messages by re-fetching the stream endpoint

- **`/create-stream`** (`app/(main)/create-stream/page.tsx`)
  - Creates a new stream (`POST /api/streams`) then redirects to `/go-live/[id]`

- **`/go-live/[streamId]`** (`app/(main)/go-live/[streamId]/page.tsx`)
  - Broadcaster studio:
    - captures media via `navigator.mediaDevices.getUserMedia`
    - polls signaling for viewer joins and answers
    - posts offers/ICE candidates to the signaling endpoint
    - posts `broadcaster-ready` and `stream-ended` signals

