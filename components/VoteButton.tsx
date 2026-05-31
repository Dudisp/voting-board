'use client';

import { useState, useEffect } from 'react';

interface VoteButtonProps {
  postId: string;
  voteCount: number;
  onVote: () => void;
  variant?: 'default' | 'note';
}

function getVotedPosts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('voted_posts') ?? '[]');
  } catch {
    return [];
  }
}

export default function VoteButton({ postId, voteCount, onVote, variant = 'default' }: VoteButtonProps) {
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(voteCount);

  useEffect(() => {
    setVoted(getVotedPosts().includes(postId));
  }, [postId]);

  useEffect(() => {
    setCount(voteCount);
  }, [voteCount]);

  async function handleVote() {
    if (voted || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId }),
      });
      if (res.ok) {
        const existing = getVotedPosts();
        localStorage.setItem('voted_posts', JSON.stringify([...existing, postId]));
        setVoted(true);
        setCount(c => c + 1);
        onVote();
      }
    } finally {
      setLoading(false);
    }
  }

  const emoji = loading ? '⏳' : voted ? '🔥' : '🚀';

  if (variant === 'note') {
    return (
      <button
        onClick={handleVote}
        disabled={voted || loading}
        aria-label={voted ? 'Already voted' : 'Upvote'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          background: voted ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.55)',
          border: '1.5px solid rgba(0,0,0,0.12)',
          borderRadius: 8,
          padding: '3px 8px 3px 6px',
          fontSize: 12,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.6)',
          cursor: voted || loading ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11 }}>{emoji}</span>
        <span>{count}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleVote}
      disabled={voted || loading}
      aria-label={voted ? 'Already voted' : 'Upvote'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        voted
          ? 'bg-orange-50 text-orange-500 cursor-default'
          : loading
          ? 'bg-gray-100 text-gray-400 cursor-wait'
          : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500 cursor-pointer'
      }`}
    >
      <span>{emoji}</span>
      <span>{count}</span>
    </button>
  );
}
