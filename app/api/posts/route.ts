import { NextRequest } from 'next/server';
import sanitizeHtml from 'sanitize-html';
import { supabase } from '@/lib/supabase';
import { postRateLimit } from '@/lib/redis';
import { hashIp } from '@/lib/hash';

export async function GET() {
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, content, created_at, score_cache')
    .order('score_cache', { ascending: false });

  if (postsError) {
    console.error('[GET /api/posts] posts query failed:', postsError);
    return Response.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  const { data: votesData } = await supabase.from('votes').select('post_id');

  const voteCountMap: Record<string, number> = {};
  (votesData ?? []).forEach(v => {
    voteCountMap[v.post_id] = (voteCountMap[v.post_id] ?? 0) + 1;
  });

  const result = (posts ?? []).map(p => ({
    id: p.id,
    content: p.content,
    created_at: p.created_at,
    score_cache: p.score_cache,
    vote_count: voteCountMap[p.id] ?? 0,
  }));

  return Response.json(result);
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const ipHash = hashIp(ip);

  const rateLimitResult = await postRateLimit.limit(ipHash);
  console.log('[POST /api/posts] rate limit result:', rateLimitResult);
  const { success } = rateLimitResult;
  if (!success) {
    return Response.json(
      { error: 'Too many posts. Try again in 10 minutes.' },
      { status: 429 }
    );
  }

  let body: { content?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
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
    .insert({ content: clean, author_ip_hash: ipHash })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Failed to create post' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
