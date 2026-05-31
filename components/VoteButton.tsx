'use client';

import { useState, useEffect } from 'react';

interface VoteButtonProps {
  postId: string;
  voteCount: number;
  onVote: () => void;
}

function getVotedPosts(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('voted_posts') ?? '[]');
  } catch {
    return [];
  }
}

export default function VoteButton({ postId, voteCount, onVote }: VoteButtonProps) {
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

  return (
    <button
      onClick={handleVote}
      disabled={voted || loading}
      aria-label={voted ? 'Already voted' : 'Upvote'}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        voted
          ? 'bg-blue-100 text-blue-600 cursor-default'
          : loading
          ? 'bg-gray-100 text-gray-400 cursor-wait'
          : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600 cursor-pointer'
      }`}
    >
      <span>{voted ? '▲' : '△'}</span>
      <span>{count}</span>
    </button>
  );
}
