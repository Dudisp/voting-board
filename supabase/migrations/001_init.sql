-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  author_ip_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  score_cache FLOAT DEFAULT 0
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  voter_ip_hash TEXT NOT NULL,
  fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, voter_ip_hash)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_posts_score_cache ON posts (score_cache DESC);
CREATE INDEX IF NOT EXISTS idx_votes_post_id ON votes (post_id);

-- Row-Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Public read policies (service role key bypasses RLS for all writes)
CREATE POLICY "public read posts" ON posts FOR SELECT USING (TRUE);
CREATE POLICY "public read votes" ON votes FOR SELECT USING (TRUE);

-- Score recalculation function (called by cron route)
CREATE OR REPLACE FUNCTION recalculate_scores()
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts p
  SET score_cache = (
    SELECT COALESCE(
      COUNT(v.id)::FLOAT / POWER(
        GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600.0, 0) + 2,
        1.8
      ),
      0
    )
    FROM votes v
    WHERE v.post_id = p.id
  );
END;
$$;
