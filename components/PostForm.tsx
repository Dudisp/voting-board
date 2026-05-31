'use client';

import { useState } from 'react';

interface PostFormProps {
  onPost: () => void;
}

const MAX_LENGTH = 300;

export default function PostForm({ onPost }: PostFormProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_LENGTH - content.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to post');
      } else {
        setContent('');
        onPost();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        maxLength={MAX_LENGTH}
        placeholder="What's on your mind? (max 300 characters)"
        rows={4}
        className="w-full resize-none text-gray-900 placeholder-gray-400 focus:outline-none text-sm leading-relaxed border border-gray-200 rounded-xl p-3 focus:border-blue-300"
      />
      <div className="flex items-center justify-between mt-3">
        <span className={`text-xs ${remaining < 50 ? 'text-amber-500' : 'text-gray-400'}`}>
          {remaining} characters remaining
        </span>
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </form>
  );
}
