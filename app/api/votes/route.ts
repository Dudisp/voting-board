import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { voteRateLimit } from '@/lib/redis';
import { hashIp } from '@/lib/hash';

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1';

  const ipHash = hashIp(ip);

  // const { success } = await voteRateLimit.limit(ipHash);
  // if (!success) {
  //   return Response.json(
  //     { success: false, message: 'Too many votes. Try again in a minute.' },
  //     { status: 429 }
  //     );
  // }

  let body: { post_id?: unknown; fingerprint?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, message: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.post_id !== 'string' || !body.post_id) {
    return Response.json({ success: false, message: 'post_id is required' }, { status: 400 });
  }

  const { error } = await supabase.from('votes').insert({
    post_id: body.post_id,
    voter_ip_hash: ipHash,
    fingerprint: typeof body.fingerprint === 'string' ? body.fingerprint : null,
  });

  if (error) {
    if (error.code === '23505') {
      return Response.json({ success: false, message: 'Already voted' }, { status: 409 });
    }
    if (error.code === '23503') {
      return Response.json({ success: false, message: 'Post not found' }, { status: 404 });
    }
    return Response.json({ success: false, message: 'Failed to vote' }, { status: 500 });
  }

  return Response.json({ success: true });
}
