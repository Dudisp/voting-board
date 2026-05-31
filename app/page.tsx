'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
  { x: 197, y: 162 }, // #1 — centered
  { x: 8,   y: 15  }, // #2
  { x: 408, y: 18  }, // #3
  { x: 4,   y: 310 }, // #4
  { x: 205, y: 8   }, // #5
  { x: 420, y: 285 }, // #6
  { x: 20,  y: 175 }, // #7
  { x: 448, y: 155 }, // #8
  { x: 188, y: 368 }, // #9
  { x: 418, y: 390 }, // #10
  { x: 12,  y: 468 }, // #11
  { x: 154, y: 478 }, // #12
  { x: 295, y: 462 }, // #13
  { x: 432, y: 472 }, // #14
  { x: 502, y: 455 }, // #15
  { x: 30,  y: 618 }, // #16
  { x: 148, y: 630 }, // #17
  { x: 272, y: 614 }, // #18
  { x: 400, y: 626 }, // #19
  { x: 514, y: 610 }, // #20
];

const SIZES = [
  { w: 225, h: 195 }, // #1
  { w: 198, h: 172 }, // #2
  { w: 185, h: 160 }, // #3
  { w: 178, h: 154 }, // #4
  { w: 172, h: 150 }, // #5
  { w: 165, h: 144 }, // #6
  { w: 160, h: 140 }, // #7
  { w: 154, h: 134 }, // #8
  { w: 148, h: 128 }, // #9
  { w: 142, h: 122 }, // #10
  { w: 138, h: 116 }, // #11
  { w: 134, h: 113 }, // #12
  { w: 130, h: 110 }, // #13
  { w: 126, h: 107 }, // #14
  { w: 122, h: 104 }, // #15
  { w: 102, h: 88  }, // #16
  { w: 98,  h: 85  }, // #17
  { w: 95,  h: 82  }, // #18
  { w: 92,  h: 80  }, // #19
  { w: 90,  h: 78  }, // #20
];

const BASE_BOARD_H = 780;
const EXTRA_ROW_H = 110;
const EXTRA_PER_ROW = 5;
const EXTRA_BASE_Y = 710;

function getPosition(rank: number): { x: number; y: number } {
  if (rank <= 20) return POSITIONS[rank - 1];
  const i = rank - 21;
  const row = Math.floor(i / EXTRA_PER_ROW);
  const col = i % EXTRA_PER_ROW;
  return {
    x: 18 + col * 108 + (col % 2 === 1 ? 8 : 0),
    y: EXTRA_BASE_Y + row * EXTRA_ROW_H + (col % 2 === 1 ? 12 : 0),
  };
}

function getSize(rank: number): { w: number; h: number } {
  if (rank <= 20) return SIZES[rank - 1];
  return { w: 85, h: 90 };
}

function getFontSize(rank: number): number {
  if (rank === 1) return 17;
  if (rank <= 3) return 15;
  if (rank <= 7) return 14;
  if (rank <= 10) return 13;
  if (rank <= 15) return 12;
  if (rank <= 20) return 11;
  return 10;
}

const BG_GRID = [
  'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(0,0,0,0.035) 40px)',
  'repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(0,0,0,0.035) 40px)',
].join(', ');

// ─── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [firstPosts, setFirstPosts] = useState<Post[]>([]);
  const [extraPosts, setExtraPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [containerWidth, setContainerWidth] = useState(620);
  const [showModal, setShowModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const allPosts = [...firstPosts, ...extraPosts];
  const extraCount = Math.max(0, allPosts.length - 20);
  const extraRows = Math.ceil(extraCount / EXTRA_PER_ROW);
  const boardHeight = BASE_BOARD_H + (extraCount > 0 ? extraRows * EXTRA_ROW_H + 80 : 0);

  // Cap scale at 1 so notes never grow beyond their fixed pixel sizes on wide screens.
  // On narrow screens, scale down to fit. Center the 620px cluster horizontally.
  const boardScale = Math.min(1, containerWidth / 620);
  const boardOffset = Math.max(0, (containerWidth - 620) / 2);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts?limit=20&offset=0');
      if (!res.ok) throw new Error();
      const fresh: Post[] = await res.json();
      setFirstPosts(fresh);
      const freshIds = new Set(fresh.map(p => p.id));
      setExtraPosts(prev => prev.filter(p => !freshIds.has(p.id)));
      setError(null);
    } catch {
      setError('Failed to load posts.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const offset = 20 + extraPosts.length;
      const res = await fetch(`/api/posts?limit=10&offset=${offset}`);
      const data: Post[] = await res.json();
      if (data.length < 10) setHasMore(false);
      if (data.length > 0) setExtraPosts(prev => [...prev, ...data]);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, extraPosts.length]);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30_000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

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

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── Navbar ── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voting Board</h1>
          <p className="text-xs text-gray-400 mt-0.5">Post something short. Upvote what matters.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <span className="text-base leading-none">+</span>
          <span>New post</span>
        </button>
      </div>

      {/* ── Board ── */}
      <div className="p-4">
        {loading && (
          <div className="text-center text-gray-400 py-12 text-sm">Loading...</div>
        )}
        {error && (
          <div className="text-center text-red-400 py-4 text-sm">{error}</div>
        )}
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
                return (
                  <PostCard
                    key={post.id}
                    post={post}
                    rank={rank}
                    onVote={fetchPosts}
                    position={getPosition(rank)}
                    size={getSize(rank)}
                    rotation={ROTATIONS[(rank - 1) % ROTATIONS.length]}
                    fontSize={getFontSize(rank)}
                    color={COLORS[(rank - 1) % COLORS.length]}
                    animated={rank > 20}
                  />
                );
              })}

              {loadingMore && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bottom: 28,
                    fontSize: 11,
                    color: 'rgba(0,0,0,0.3)',
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                  }}
                >
                  loading…
                </div>
              )}

              {hasMore && !loadingMore && (
                <div
                  ref={sentinelRef}
                  style={{ position: 'absolute', bottom: 80, left: 0, width: 1, height: 1 }}
                />
              )}
            </div>
          </div>
        )}
      </div>

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
              onPost={() => {
                fetchPosts();
                setShowModal(false);
              }}
            />
          </div>
        </div>
      )}

    </main>
  );
}
