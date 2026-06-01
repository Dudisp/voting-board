import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const slug = new URL(request.url).searchParams.get('slug');

  if (slug) {
    const { data, error } = await supabase
      .from('boards')
      .select('id, slug, name, created_at')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return Response.json({ error: 'Board not found' }, { status: 404 });
    }
    return Response.json(data);
  }

  const { data, error } = await supabase
    .from('boards')
    .select('id, slug, name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    return Response.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }

  return Response.json(data ?? []);
}

export async function POST(request: NextRequest) {
  let body: { slug?: unknown; name?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (
    typeof body.slug !== 'string' ||
    !/^[a-z0-9][a-z0-9-]*$/.test(body.slug) ||
    body.slug.length > 50
  ) {
    return Response.json(
      { error: 'Slug must be lowercase letters, numbers, and hyphens (max 50 chars)' },
      { status: 400 }
    );
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('boards')
    .insert({ slug: body.slug, name: body.name.trim() })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return Response.json({ error: 'A board with that slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Failed to create board' }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
