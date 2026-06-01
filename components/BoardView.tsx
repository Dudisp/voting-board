'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import PostForm from '@/components/PostForm';
import type { Post } from '@/types';

// ─── Layout constants (620px reference coordinate space) ────────────────────

const COLORS = ['#fff9a3', '#b8f0b8', '#ffc8c8', '#c8e8ff', '#ffd9a0', '#e8c8ff'];

const ROTATIONS = [
  -2.8, 3.4, -3.9, 2.2, -4.5, 3.8, -1.7, 4.2, -2.5, 3.1,
  -3.6, 2.7, -4.1, 1.9, -3.2, 2.5, -4.3, 3.0, -2.1, 4.6,
];

const POSITIONS = [
  { x: 197, y: 162 }, { x: 8,   y: 15  }, { x: 408, y: 18  },
  { x: 4,   y: 310 }, { x: 205, y: 8   }, { x: 420, y: 285 },
  { x: 20,  y: 175 }, { x: 448, y: 155 }, { x: 188, y: 368 },
  { x: 418, y: 390 }, { x: 12,  y: 468 }, { x: 154, y: 478 },
  { x: 295, y: 462 }, { x: 432, y: 472 }, { x: 502, y: 455 },
  { x: 30,  y: 618 }, { x: 148, y: 630 }, { x: 272, y: 614 },
  { x: 400, y: 626 }, { x: 514, y: 610 },
];

const SIZES = [
  { w: 225, h: 195 }, { w: 198, h: 172 }, { w: 185, h: 160 },
  { w: 178, h: 154 }, { w: 172, h: 150 }, { w: 165, h: 144 },
  { w: 160, h: 140 }, { w: 154, h: 134 }, { w: 148, h: 128 },
  { w: 142, h: 122 }, { w: 138, h: 116 }, { w: 134, h: 113 },
  { w: 130, h: 110 }, { w: 126, h: 107 }, { w: 122, h: 104 },
  { w: 102, h: 88  }, { w: 98,  h: 85  }, { w: 95,  h: 82  },
  { w: 92,  h: 80  }, { w: 90,  h: 78  },
];

const BASE_BOARD_H = 780;
const EXTRA_ROW_H = 110;
const EXTRA_PER_ROW = 5;
const EXTRA_BASE_Y = 710;

// 7 slots per column (side × depth), 8 columns → 56 total
// y values cap at ~630 so notes (h≈125) don't overflow the 780px board
const SIDE_SLOTS: { side: 'left' | 'right'; xFromEdge: number; y: number }[] = [
  // Depth 0 — near edge (margin > 150px)
  { side: 'left',  xFromEdge: 15,  y: 28  }, { side: 'left',  xFromEdge: 20,  y: 130 },
  { side: 'left',  xFromEdge: 12,  y: 232 }, { side: 'left',  xFromEdge: 18,  y: 335 },
  { side: 'left',  xFromEdge: 14,  y: 436 }, { side: 'left',  xFromEdge: 19,  y: 536 },
  { side: 'left',  xFromEdge: 16,  y: 622 },
  { side: 'right', xFromEdge: 16,  y: 38  }, { side: 'right', xFromEdge: 11,  y: 140 },
  { side: 'right', xFromEdge: 19,  y: 242 }, { side: 'right', xFromEdge: 13,  y: 344 },
  { side: 'right', xFromEdge: 17,  y: 445 }, { side: 'right', xFromEdge: 12,  y: 544 },
  { side: 'right', xFromEdge: 15,  y: 630 },

  // Depth 1 — 1st inner column (margin > 320px)
  { side: 'left',  xFromEdge: 168, y: 76  }, { side: 'left',  xFromEdge: 172, y: 178 },
  { side: 'left',  xFromEdge: 164, y: 280 }, { side: 'left',  xFromEdge: 170, y: 382 },
  { side: 'left',  xFromEdge: 166, y: 482 }, { side: 'left',  xFromEdge: 171, y: 580 },
  { side: 'left',  xFromEdge: 167, y: 625 },
  { side: 'right', xFromEdge: 170, y: 64  }, { side: 'right', xFromEdge: 163, y: 166 },
  { side: 'right', xFromEdge: 171, y: 268 }, { side: 'right', xFromEdge: 165, y: 370 },
  { side: 'right', xFromEdge: 169, y: 470 }, { side: 'right', xFromEdge: 164, y: 568 },
  { side: 'right', xFromEdge: 168, y: 618 },

  // Depth 2 — 2nd inner column (margin > 470px)
  { side: 'left',  xFromEdge: 315, y: 52  }, { side: 'left',  xFromEdge: 321, y: 155 },
  { side: 'left',  xFromEdge: 311, y: 258 }, { side: 'left',  xFromEdge: 318, y: 360 },
  { side: 'left',  xFromEdge: 314, y: 460 }, { side: 'left',  xFromEdge: 320, y: 558 },
  { side: 'left',  xFromEdge: 316, y: 618 },
  { side: 'right', xFromEdge: 317, y: 62  }, { side: 'right', xFromEdge: 309, y: 163 },
  { side: 'right', xFromEdge: 320, y: 266 }, { side: 'right', xFromEdge: 313, y: 368 },
  { side: 'right', xFromEdge: 318, y: 468 }, { side: 'right', xFromEdge: 311, y: 566 },
  { side: 'right', xFromEdge: 315, y: 624 },

  // Depth 3 — near cluster (margin > 615px, full HD)
  { side: 'left',  xFromEdge: 462, y: 95  }, { side: 'left',  xFromEdge: 468, y: 196 },
  { side: 'left',  xFromEdge: 457, y: 298 }, { side: 'left',  xFromEdge: 464, y: 400 },
  { side: 'left',  xFromEdge: 460, y: 500 }, { side: 'left',  xFromEdge: 466, y: 596 },
  { side: 'left',  xFromEdge: 461, y: 628 },
  { side: 'right', xFromEdge: 463, y: 82  }, { side: 'right', xFromEdge: 456, y: 184 },
  { side: 'right', xFromEdge: 466, y: 286 }, { side: 'right', xFromEdge: 459, y: 388 },
  { side: 'right', xFromEdge: 462, y: 488 }, { side: 'right', xFromEdge: 457, y: 585 },
  { side: 'right', xFromEdge: 463, y: 622 },
];

const SIDE_NOTE_W = 140;
const SIDE_NOTE_H = 125;

const BG_GRID = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.035) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.035) 40px)',
].join(', ');

function getPosition(rank: number) {
  if (rank <= 20) return POSITIONS[rank - 1];
  const i = rank - 21;
  const row = Math.floor(i / EXTRA_PER_ROW);
  const col = i % EXTRA_PER_ROW;
  return {
    x: 18 + col * 108 + (col % 2 === 1 ? 8 : 0),
    y: EXTRA_BASE_Y + row * EXTRA_ROW_H + (col % 2 === 1 ? 12 : 0),
  };
}

function getSize(rank: number) {
  if (rank <= 20) return SIZES[rank - 1];
  return { w: 85, h: 90 };
}

function getFontSize(rank: number) {
  if (rank === 1) return 17;
  if (rank <= 3) return 15;
  if (rank <= 7) return 14;
  if (rank <= 10) return 13;
  if (rank <= 15) return 12;
  if (rank <= 20) return 11;
  return 10;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BoardView({ slug }: { slug: string }) {
  const [boardName, setBoardName] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [firstPosts, setFirstPosts] = useState<Post[]>([]);
  const [extraPosts, setExtraPosts] = useState<Post[]>([]);
  const [sidePosts, setSidePosts] = useState<Post[]>([]);
  const [mobileNotes, setMobileNotes] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mobileHasMore, setMobileHasMore] = useState(true);
  const [mobileFetching, setMobileFetching] = useState(false);
  const [containerWidth, setContainerWidth] = useState(620);
  const [showModal, setShowModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const mobileSentinelRef = useRef<HTMLDivElement>(null);
  const sideStyles = useRef<{ color: string; rotation: number }[]>([]);
  const mainStyles = useRef<{ color: string; rotation: number }[]>([]);
  const mobileStyles = useRef<{ color: string; rotation: number }[]>([]);
  const sideActiveSlots = useRef<Set<number>>(new Set(SIDE_SLOTS.map((_, i) => i)));
  const mobileNotesOffset = useRef(0);

  const allPosts = [...firstPosts, ...extraPosts];
  const extraCount = Math.max(0, allPosts.length - 20);
  const extraRows = Math.ceil(extraCount / EXTRA_PER_ROW);
  const boardHeight = BASE_BOARD_H + (extraCount > 0 ? extraRows * EXTRA_ROW_H + 80 : 0);

  const boardScale = Math.min(1, containerWidth / 620);
  const boardOffset = Math.max(0, (containerWidth - 620) / 2);
  const isMobile = boardOffset < SIDE_NOTE_W + 30;
  const visibleSideSlots = SIDE_SLOTS.filter(
    (slot, i) => slot.xFromEdge + SIDE_NOTE_W + 10 < boardOffset && sideActiveSlots.current.has(i)
  );

  // Generate all random styles + active slot selection once on mount
  useEffect(() => {
    sideStyles.current = SIDE_SLOTS.map((_, i) => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: ROTATIONS[(i + 7) % ROTATIONS.length] + (Math.random() - 0.5) * 6,
    }));

    mainStyles.current = Array.from({ length: 20 }, (_, i) => ({
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: ROTATIONS[i % ROTATIONS.length] + (Math.random() - 0.5) * 4,
    }));

    // 7 slots per column, pick 3–7 randomly each load
    const active = new Set<number>();
    const COL = 7;
    for (let c = 0; c < SIDE_SLOTS.length / COL; c++) {
      const start = c * COL;
      const count = 3 + Math.floor(Math.random() * 5); // 3–7
      Array.from({ length: COL }, (_, k) => start + k)
        .sort(() => Math.random() - 0.5)
        .slice(0, count)
        .forEach(i => active.add(i));
    }
    sideActiveSlots.current = active;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  // Fetch board metadata
  useEffect(() => {
    fetch(`/api/boards?slug=${slug}`)
      .then(async r => {
        if (!r.ok) { setNotFound(true); return; }
        const data = await r.json();
        setBoardName(data.name);
        document.title = `${data.name} — Voting Board`;
      });
  }, [slug]);

  // Refresh main posts only (used by interval + vote callbacks)
  const refreshPosts = useCallback(async () => {
    const res = await fetch(`/api/posts?board=${slug}&limit=20&offset=0`);
    if (!res.ok) return;
    const fresh: Post[] = await res.json();
    setFirstPosts(fresh);
    const freshIds = new Set(fresh.map(p => p.id));
    setExtraPosts(prev => prev.filter(p => !freshIds.has(p.id)));
    setError(null);
  }, [slug]);

  // Initial load: fetch main + side posts simultaneously, show everything at once
  useEffect(() => {
    Promise.all([
      fetch(`/api/posts?board=${slug}&limit=20&offset=0`).then(r => r.json()),
      fetch(`/api/posts?board=${slug}&offset=20&limit=60`).then(r => r.json()),
    ])
      .then(([mainData, sideData]: [Post[], Post[]]) => {
        setFirstPosts(mainData);
        const shuffled = [...sideData].sort(() => Math.random() - 0.5);
        setSidePosts(shuffled.slice(0, SIDE_SLOTS.length));
        setError(null);
      })
      .catch(() => setError('Failed to load posts.'))
      .finally(() => setLoading(false));

    const interval = setInterval(refreshPosts, 30_000);
    return () => clearInterval(interval);
  }, [slug, refreshPosts]);

  // Ranked infinite scroll (inside board, all screens)
  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = 20 + extraPosts.length;
      const res = await fetch(`/api/posts?board=${slug}&limit=10&offset=${offset}`);
      const data: Post[] = await res.json();
      if (data.length < 10) setHasMore(false);
      if (data.length > 0) setExtraPosts(prev => [...prev, ...data]);
    } finally {
      setLoadingMore(false);
    }
  }, [slug, loadingMore, hasMore, extraPosts.length]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore(); },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [fetchMore, hasMore]);

  // Mobile random scroll (below board, mobile only)
  const fetchMobileNotes = useCallback(async () => {
    if (mobileFetching || !mobileHasMore) return;
    setMobileFetching(true);
    try {
      const res = await fetch(`/api/posts?board=${slug}&offset=${20 + mobileNotesOffset.current}&limit=10`);
      if (!res.ok) return;
      const data: Post[] = await res.json();
      if (data.length < 10) setMobileHasMore(false);
      if (data.length > 0) {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        const newStyles = shuffled.map(() => ({
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          rotation: (Math.random() - 0.5) * 10,
        }));
        mobileStyles.current = [...mobileStyles.current, ...newStyles];
        setMobileNotes(prev => [...prev, ...shuffled]);
        mobileNotesOffset.current += data.length;
      }
    } finally {
      setMobileFetching(false);
    }
  }, [slug, mobileFetching, mobileHasMore]);

  useEffect(() => {
    if (!isMobile) return;
    const sentinel = mobileSentinelRef.current;
    if (!sentinel || !mobileHasMore) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMobileNotes(); },
      { threshold: 0 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [isMobile, fetchMobileNotes, mobileHasMore]);

  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Board not found.</p>
        <Link href="/" className="text-blue-600 text-sm hover:underline">← All boards</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm shrink-0">
            ← All boards
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{boardName || slug}</h1>
            <p className="text-xs text-gray-400 mt-0.5">Post something short. Upvote what matters.</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shrink-0 ml-4"
        >
          <span className="text-base leading-none">+</span>
          <span>New post</span>
        </button>
      </div>

      {/* ── Board ── */}
      <div className="p-4">
        {loading && <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>}
        {error && <div className="text-center text-red-400 py-4 text-sm">{error}</div>}
        {!loading && allPosts.length === 0 && !error && (
          <div className="text-center text-gray-400 py-12 text-sm">No posts yet. Be the first!</div>
        )}

        {!loading && allPosts.length > 0 && (
          <div
            ref={containerRef}
            style={{
              position: 'relative',
              width: '100%',
              height: boardHeight * boardScale,
              background: '#eae6de',
              backgroundImage: BG_GRID,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            {/* Main 620px cluster */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: boardOffset,
                width: 620,
                height: boardHeight,
                transform: `scale(${boardScale})`,
                transformOrigin: 'top left',
              }}
            >
              {allPosts.map((post, i) => {
                const rank = i + 1;
                const ms = mainStyles.current[i] ?? {
                  color: COLORS[(rank - 1) % COLORS.length],
                  rotation: ROTATIONS[(rank - 1) % ROTATIONS.length],
                };
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    rank={rank}
                    onVote={refreshPosts}
                    position={getPosition(rank)}
                    size={getSize(rank)}
                    rotation={ms.rotation}
                    fontSize={getFontSize(rank)}
                    color={ms.color}
                    animated={rank > 20}
                  />
                );
              })}

              {loadingMore && (
                <div style={{
                  position: 'absolute', left: '50%',
                  transform: 'translateX(-50%)', bottom: 28,
                  fontSize: 11, color: 'rgba(0,0,0,0.3)',
                  fontStyle: 'italic', whiteSpace: 'nowrap',
                }}>
                  loading…
                </div>
              )}

              {hasMore && !loadingMore && (
                <div ref={sentinelRef} style={{ position: 'absolute', bottom: 80, left: 0, width: 1, height: 1 }} />
              )}
            </div>

            {/* Desktop side discovery notes */}
            {!isMobile && visibleSideSlots.map((slot, i) => {
              const post = sidePosts[i];
              if (!post) return null;
              const x = slot.side === 'left'
                ? slot.xFromEdge
                : containerWidth - slot.xFromEdge - SIDE_NOTE_W;
              const style = sideStyles.current[SIDE_SLOTS.indexOf(slot)] ?? {
                color: COLORS[(i + 2) % COLORS.length],
                rotation: ROTATIONS[(i + 7) % ROTATIONS.length],
              };
              return (
                <PostCard
                  key={`side-${post.id}-${i}`}
                  post={post}
                  rank={i + 21}
                  onVote={refreshPosts}
                  position={{ x, y: slot.y }}
                  size={{ w: SIDE_NOTE_W, h: SIDE_NOTE_H }}
                  rotation={style.rotation}
                  fontSize={12}
                  color={style.color}
                  sideNote
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ── Mobile discovery scroll (below board, mobile only) ── */}
      {!loading && isMobile && (
        <div className="px-3 pb-10">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            {mobileNotes.map((post, i) => {
              const s = mobileStyles.current[i] ?? {
                color: COLORS[i % COLORS.length],
                rotation: 0,
              };
              return (
                <PostCard
                  key={`mobile-${post.id}`}
                  post={post}
                  rank={i + 21}
                  onVote={refreshPosts}
                  position={{ x: 0, y: 0 }}
                  size={{ w: 140, h: 120 }}
                  rotation={s.rotation}
                  fontSize={12}
                  color={s.color}
                  sideNote
                  relativeMode
                />
              );
            })}
          </div>

          {mobileFetching && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(0,0,0,0.3)', padding: '16px 0', fontStyle: 'italic' }}>
              loading…
            </div>
          )}
          {mobileHasMore && !mobileFetching && (
            <div ref={mobileSentinelRef} style={{ height: 20 }} />
          )}
        </div>
      )}

      {/* ── New post modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-[1000] px-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md relative shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">New post</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <PostForm
              board={slug}
              onPost={() => { refreshPosts(); setShowModal(false); }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
