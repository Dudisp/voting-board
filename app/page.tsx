'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Board {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/boards')
      .then(r => r.json())
      .then(data => { setBoards(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, name }),
    });
    const data = await res.json();
    if (res.ok) {
      setBoards(prev => [...prev, data]);
      setSlug('');
      setName('');
      setShowCreate(false);
    } else {
      setCreateError(data.error ?? 'Failed to create board');
    }
    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-12">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voting Board</h1>
            <p className="text-sm text-gray-400 mt-0.5">Pick a board to join</p>
          </div>
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <span className="text-base leading-none">+</span>
            <span>New board</span>
          </button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Board name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Product Ideas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Slug <span className="text-gray-400">(used in the URL: /b/slug)</span>
                </label>
                <input
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="e.g. product-ideas"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 font-mono"
                  required
                />
              </div>
              {createError && <p className="text-xs text-red-500">{createError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !slug || !name}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? 'Creating…' : 'Create board'}
                </button>
              </div>
            </div>
          </form>
        )}

        {loading && <div className="text-center text-gray-400 py-12 text-sm">Loading…</div>}

        {!loading && boards.length === 0 && (
          <div className="text-center text-gray-400 py-12 text-sm">No boards yet. Create one above.</div>
        )}

        <div className="flex flex-col gap-3">
          {boards.map(board => (
            <Link
              key={board.id}
              href={`/b/${board.slug}`}
              className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {board.name}
                </span>
                <span className="ml-2 text-xs text-gray-400 font-mono">/b/{board.slug}</span>
              </div>
              <span className="text-gray-300 group-hover:text-blue-400 transition-colors text-lg">→</span>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
