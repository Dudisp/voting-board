import { NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { supabase } from '@/lib/supabase';
import { postRateLimit } from '@/lib/redis';
import { hashIp } from '@/lib/hash';
import { calculateScore } from '@/lib/ranking';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const boardSlug = url.searchParams.get('board');
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') ?? '0', 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') ?? '200', 10)));

  let boardId: string | null = null;
  if (boardSlug) {
    const { data: board } = await supabase
      .from('boards')
      .select('id')
      .eq('slug', boardSlug)
      .maybeSingle();

    if (!board) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }
    boardId = board.id;
  }

  let postsQuery = supabase.from('posts').select('id, content, created_at');
  if (boardId) postsQuery = postsQuery.eq('board_id', boardId);

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  const postIds = (posts ?? []).map(p => p.id);

  const { data: votesData } = postIds.length > 0
    ? await supabase.from('votes').select('post_id').in('post_id', postIds)
    : { data: [] as { post_id: string }[] };

  const voteCountMap: Record<string, number> = {};
  (votesData ?? []).forEach(v => {
    voteCountMap[v.post_id] = (voteCountMap[v.post_id] ?? 0) + 1;
  });

  const sorted = (posts ?? [])
    .map(p => ({
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      vote_count: voteCountMap[p.id] ?? 0,
      score_cache: calculateScore(voteCountMap[p.id] ?? 0, p.created_at),
    }))
    .sort((a, b) => b.score_cache - a.score_cache);

  return Response.json(sorted.slice(offset, offset + limit));
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const ipHash = hashIp(ip);

  const { success } = await postRateLimit.limit(ipHash);
  if (!success) {
    return Response.json(
      { error: 'Too many posts. Try again in 10 minutes.' },
      { status: 429 }
    );
  }

  let body: { content?: unknown; board?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.board !== 'string' || !body.board) {
    return Response.json({ error: 'board slug is required' }, { status: 400 });
  }

  const { data: board } = await supabase
    .from('boards')
    .select('id')
    .eq('slug', body.board)
    .maybeSingle();

  if (!board) {
    return Response.json({ error: 'Board not found' }, { status: 404 });
  }

  if (typeof body.content !== 'string') {
    return Response.json({ error: 'Content must be a string' }, { status: 400 });
  }

  const clean = sanitizeHtml(body.content, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();

  if (clean.length === 0) {
    return Response.json({ error: 'Post content cannot be empty' }, { status: 400 });
  }
  if (clean.length > 300) {
    return Response.json({ error: 'Post content too long (max 300 characters)' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({ content: clean, author_ip_hash: ipHash, board_id: board.id })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
