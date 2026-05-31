'use client';

import { useEffect, useState, useCallback } from 'react';
import PostCard from '@/components/PostCard';
import PostForm from '@/components/PostForm';
import type { Post } from '@/types';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data: Post[] = await res.json();
      setPosts(data);
      setError(null);
    } catch {
      setError('Failed to load posts. Retrying...');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30_000);
    return () => clearInterval(interval);
  }, [fetchPosts]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Voting Board</h1>
        <p className="text-gray-500 text-sm">Post something short. Upvote what matters. Ranked by score.</p>
      </div>

      <PostForm onPost={fetchPosts} />

      <div className="mt-8 space-y-4">
        {loading && (
          <div className="text-center text-gray-400 py-12 text-sm">Loading posts...</div>
        )}
        {error && (
          <div className="text-center text-red-400 py-4 text-sm">{error}</div>
        )}
        {!loading && posts.length === 0 && !error && (
          <div className="text-center text-gray-400 py-12 text-sm">
            No posts yet. Be the first!
          </div>
        )}
        {posts.map((post, index) => (
          <PostCard key={post.id} post={post} rank={index + 1} onVote={fetchPosts} />
        ))}
      </div>
    </main>
  );
}
