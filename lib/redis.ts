import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const postRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '10 m'),
  prefix: 'post_limit',
});

export const voteRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix: 'vote_limit',
});
