# Voting Board — Claude Code Spec

## Project Overview

A real-time public voting board where anyone can post a short message and upvote others.
Posts are ranked by score with time decay, so new posts can surface over old ones.
The top post is displayed largest, shrinking progressively down the list.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Frontend | React + Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Cache / Rate limiting | Upstash Redis |
| Deployment | Vercel (frontend + API routes) |
| Security / CDN | Cloudflare (free tier) |

---

## Database Schema

```sql
-- Posts table
create table posts (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 300),
  author_ip_hash text not null,         -- SHA-256 of IP, never store raw IP
  created_at timestamptz default now(),
  score_cache float default 0           -- recalculated periodically, used for sorting
);

-- Votes table
create table votes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  voter_ip_hash text not null,
  fingerprint text,                     -- optional browser fingerprint
  created_at timestamptz default now(),
  unique(post_id, voter_ip_hash)        -- one vote per post per IP
);
```

---

## Ranking Algorithm

Use the Hacker News gravity formula, calculated server-side:

```
score = vote_count / (age_in_hours + 2) ^ 1.8
```

- `gravity = 1.8` (tune this to control how fast posts decay)
- Recalculate `score_cache` for all posts every 60 seconds via a cron job (Vercel Cron)
- Sort posts by `score_cache DESC` on the frontend

---

## API Routes

### `POST /api/posts`
Create a new post.
- Body: `{ content: string }`
- Rate limit: 1 post per IP per 10 minutes (via Upstash Redis)
- Sanitize content: strip HTML, trim whitespace
- Hash IP before storing: `sha256(ip + SECRET_SALT)`
- Return: created post object

### `GET /api/posts`
Fetch all posts sorted by `score_cache DESC`.
- No auth required
- Return: array of posts with `{ id, content, created_at, vote_count, score_cache }`

### `POST /api/votes`
Upvote a post.
- Body: `{ post_id: string, fingerprint?: string }`
- Rate limit: 5 votes per IP per minute (Upstash Redis)
- Check `votes` table for duplicate (post_id + ip_hash)
- Return: `{ success: boolean, message?: string }`

### `GET /api/cron/recalculate`
Recalculate `score_cache` for all posts.
- Secured with `CRON_SECRET` header
- Run via Vercel Cron every 60 seconds
- Formula: `score = votes / (hours_since_created + 2) ^ 1.8`

---

## Frontend Pages

### `/` — Main Board
- Fetch posts from `GET /api/posts` every 30 seconds (polling, no WebSocket needed)
- Display posts in a visually ranked layout:
  - **1st post**: large card, full width, big font (~2rem)
  - **2nd post**: medium card, ~1.4rem
  - **3rd post**: slightly smaller
  - **4th+**: standard list size
- Each post card shows: content, relative time ("3 minutes ago"), vote count, upvote button
- Upvote button: disabled after user votes (track in localStorage by post_id)
- New post form at the top: textarea (max 300 chars) + submit button

---

## Security Requirements

### Input Sanitization
- Strip all HTML from post content before storing (use `sanitize-html` or DOMPurify on server)
- Max content length: 300 characters (enforced in DB constraint AND API validation)
- Reject empty or whitespace-only posts

### Rate Limiting (Upstash Redis)
- Post creation: 1 per IP per 10 minutes — key: `post_limit:{ip_hash}`
- Voting: 5 per IP per minute — key: `vote_limit:{ip_hash}`
- Return HTTP 429 with a clear message when exceeded

### IP Handling
- Never store raw IPs
- Hash with: `sha256(rawIp + process.env.IP_SALT)` where `IP_SALT` is a secret env var
- Use `x-forwarded-for` header (Cloudflare sets this correctly)

### Vote Deduplication
- Primary: DB unique constraint on `(post_id, voter_ip_hash)`
- Secondary: browser localStorage (`voted_posts: [post_id, ...]`) to disable the button client-side
- Optional: accept `fingerprint` from FingerprintJS (free tier) for stronger deduplication

### Headers
Add these via `next.config.js` headers:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Security
IP_SALT=                    # random secret string, never change after launch
CRON_SECRET=                # random secret for securing the cron endpoint
```

---

## Project Structure

```
/app
  /api
    /posts/route.ts          # GET + POST
    /votes/route.ts          # POST
    /cron/recalculate/route.ts
  /page.tsx                  # Main board UI
  /layout.tsx
/components
  PostCard.tsx               # Single post display
  PostForm.tsx               # New post submission form
  VoteButton.tsx             # Upvote button with state
/lib
  supabase.ts                # Supabase client
  redis.ts                   # Upstash Redis client
  ranking.ts                 # Score calculation function
  hash.ts                    # IP hashing utility
```

---

## Implementation Order

Build in this order so each step is independently testable:

1. **Supabase setup** — create tables, enable RLS (row-level security), test connection
2. **`GET /api/posts`** — fetch and return posts, verify sorting works
3. **`POST /api/posts`** — create post with sanitization and rate limiting
4. **`POST /api/votes`** — vote with deduplication and rate limiting
5. **Cron job** — recalculate scores, verify time decay works
6. **Frontend — post list** — display ranked posts with correct sizing
7. **Frontend — post form** — submit new posts
8. **Frontend — vote button** — upvote with localStorage state
9. **Security headers** — add via next.config.js
10. **Deploy to Vercel** — connect Supabase + Upstash env vars, enable Vercel Cron

---

## Notes & Decisions

- **No login required** to post or vote. Anonymous with IP-based deduplication.
- **Polling over WebSockets** — simpler, no persistent connection needed for this use case. Refresh every 30s is fine.
- **Upstash Redis** chosen over self-hosted Redis because it has a free tier and works natively with Vercel serverless functions (no persistent connection required).
- **Score is cached** in the DB rather than computed on every read — avoids N+1 query on every page load.
- **Cloudflare** sits in front of Vercel and handles DDoS, caching static assets, and adding a layer of IP rate limiting before requests even hit the app.
