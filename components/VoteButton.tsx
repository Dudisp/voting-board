'use client';

import { useState, useEffect } from 'react';

interface VoteButtonProps {
  postId: string;
  voteCount: number;
  onVote: () => void;
  small?: boolean;
}

function getVotedPosts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('voted_posts') ?? '[]');
  } catch {
    return [];
  }
}

export default function VoteButton({ postId, voteCount, onVote, small }: VoteButtonProps) {
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
  const base = small ? 'px-2 py-1 text-xs rounded-full' : 'px-3 py-1.5 text-sm rounded-full';

  return (
    <button
      onClick={handleVote}
      disabled={voted || loading}
      aria-label={voted ? 'Already voted' : 'Upvote'}
      className={`flex items-center gap-1 font-medium transition-all whitespace-nowrap ${base} ${
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
