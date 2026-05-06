# BLOGIFY

BLOGIFY is a Next.js (App Router) blogging + live streaming demo app. It ships with blog CRUD APIs + UI, a creator dashboard UI, a WebRTC-based “Go Live” studio + viewer page, and AI helpers for drafting/improving content.

**Storage note (important)**: Most app data is stored in a **global in-memory store** with **file persistence** to `.data/*.json` (see `lib/store.ts`). A PostgreSQL + Prisma schema exists at `prisma/schema.prisma`, but the current Next.js API routes do **not** use Prisma.

## Features

- **Auth (demo)**: register + login, token stored in `localStorage`
- **Blogs**: list/search/filter, create (published or draft), read (increments views), update/delete, comments, like toggle
- **Profiles**: public profile by username + simple stats; profile update by user id
- **Creator dashboard**: analytics summary + recent blogs/streams
- **Live streaming**: WebRTC peer-to-peer broadcast (studio + viewer), REST polling signaling, live chat via API
- **AI tools**:
  - Groq-powered draft generation (`/api/ai/generate-draft`, `/api/generate-blog`)
  - local “improve content” and “SEO suggestions” helpers

## Tech stack (from `package.json` and source)

- **Framework**: Next.js `16.1.6`
- **Language**: TypeScript `5.7.3`
- **UI**: React `19.2.4`
- **Styling**: Tailwind CSS `^4.2.0`, `clsx`, `tailwind-merge`, `tw-animate-css`
- **Component primitives**: Radix UI + shadcn-style components under `components/ui/`
- **Charts**: Recharts
- **3D background**: Three.js + `@react-three/fiber` + `@react-three/drei`
- **Forms/validation**: `react-hook-form`, `zod`, `@hookform/resolvers`
- **AI**: `ai` SDK + `@ai-sdk/groq`
- **Database schema**: Prisma schema for PostgreSQL (`prisma/schema.prisma`)

## Folder structure

```
app/
  (auth)/                 auth pages layout + pages
  (landing)/              landing layout + page
  (main)/                 main app layout + pages
  api/                    Next.js API routes
  contexts/               React context (Auth)
  layout.tsx              root layout + providers + metadata
components/
  Header.tsx
  ThreeBackground.tsx
  ui/
hooks/
lib/
prisma/
server/
public/
styles/
```

## Pages / screens

- `/` (authenticated home feed): `app/(main)/page.tsx`
- `/index` (landing page): `app/(landing)/index/page.tsx`
- `/login`: `app/(auth)/login/page.tsx`
- `/register`: `app/(auth)/register/page.tsx`
- `/blog`: `app/(main)/blog/page.tsx`
- `/blog/[slug]`: `app/(main)/blog/[slug]/page.tsx`
- `/create`: `app/(main)/create/page.tsx`
- `/dashboard`: `app/(main)/dashboard/page.tsx`
- `/profile/[username]`: `app/(main)/profile/[username]/page.tsx`
- `/streams`: `app/(main)/streams/page.tsx`
- `/stream/[streamId]`: `app/(main)/stream/[streamId]/page.tsx`
- `/create-stream`: `app/(main)/create-stream/page.tsx`
- `/go-live/[streamId]`: `app/(main)/go-live/[streamId]/page.tsx`

## API endpoints (Next.js `app/api/**/route.ts`)

Base URL: `http://localhost:3000`

### Auth

- **POST** `/api/auth/register`: register user (persists to `.data/users.json`), returns `{ user, token }`
- **POST** `/api/auth/login`: login, returns `{ user, token }`

### Users

- **GET** `/api/users/[userId]`: get user by id (password removed)
- **PUT** `/api/users/[userId]`: update user fields (password ignored), persists to `.data/users.json`
- **GET** `/api/users/profile/[username]`: profile by username + published blogs + streams + stats

### Blogs

- **GET** `/api/blogs`: list blogs
  - query params: `authorId`, `published`, `q`
- **POST** `/api/blogs`: create blog (published or draft)
- **GET** `/api/blogs/[slug]`: get blog by slug (or id), increments views, includes comments
- **PUT** `/api/blogs/[slug]`: update blog by slug (or id)
- **DELETE** `/api/blogs/[slug]`: delete blog by slug (or id)
- **GET** `/api/blogs/[slug]/comments`: list comments (slug or id)
- **POST** `/api/blogs/[slug]/comments`: create comment (slug or id)
- **POST** `/api/blogs/[slug]/like`: toggle like (expects body `{ userId }`)

### Streams + signaling + chat

- **GET** `/api/streams`: list streams
- **POST** `/api/streams`: create stream
- **GET** `/api/streams/[streamId]`: get stream + last 50 chat messages + creator info
- **PUT** `/api/streams/[streamId]`: update stream fields
- **GET** `/api/streams/[streamId]/signal`: poll signaling messages
  - query params: `after` (timestamp), `viewerId`
- **POST** `/api/streams/[streamId]/signal`: send signal (offer/answer/ice-candidate/viewer-joined/etc.)
- **POST** `/api/chat/[streamId]/message`: create chat message

### Analytics

- **GET** `/api/analytics/creator/[userId]/dashboard`: dashboard analytics + recent content

### AI

- **POST** `/api/ai/generate-draft`: Groq-powered draft (fallback mock if `GROQ_API_KEY` missing)
- **POST** `/api/ai/improve`: local improvement helper
- **POST** `/api/ai/seo-suggestions`: local SEO helper
- **POST** `/api/generate-blog`: Groq-powered blog generation

## Database schema / models

Prisma schema lives in `prisma/schema.prisma` (PostgreSQL, `DATABASE_URL`). Current runtime APIs use `lib/store.ts` instead of Prisma.

## Environment variables

See `.env.example`.

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blogify"
PORT=5000
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk-...
NEXT_PUBLIC_API_URL=http://localhost:5000
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_STORAGE_URL=http://localhost:3000/uploads
NEXT_PUBLIC_STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
NEXT_PUBLIC_TURN_SERVERS=
NEXT_PUBLIC_TURN_USERNAME=
NEXT_PUBLIC_TURN_PASSWORD=
```

## Install & run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Demo login

- email: `demo@example.com`
- password: `password123`

## Screenshots (placeholders)

- `docs/screenshots/home.png`
- `docs/screenshots/blog-list.png`
- `docs/screenshots/blog-detail.png`
- `docs/screenshots/create.png`
- `docs/screenshots/streams.png`
- `docs/screenshots/stream-viewer.png`
- `docs/screenshots/go-live.png`
- `docs/screenshots/dashboard.png`

## Known limitations (from current code)

- **Auth is not secure**: passwords are plain text; token is Base64 JSON (not signed, no expiry), and is not used to authorize API calls.
- **No ownership checks**: most APIs trust `authorId` / `userId` in the request body.
- **Blog like route mismatch**: the blog detail page posts to `/api/blogs/${blog.id}/like`, but the implemented endpoint is `/api/blogs/[slug]/like`. (There are directories under `app/api/blogs/[id]/...` but no `route.ts` there.)
- **Prisma not integrated**: the Prisma schema is present but not used by the Next.js API routes.
- **Standalone Express server is not wired**: `server/index.js` exists, but `package.json` doesn’t include scripts to run it and dependencies are not declared there.
