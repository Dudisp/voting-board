-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (
    slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR slug ~ '^[a-z0-9]$'
  ),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_boards_slug ON boards (slug);

-- Add board_id to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS board_id UUID REFERENCES boards(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_posts_board_id ON posts (board_id);

-- RLS
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read boards" ON boards FOR SELECT USING (TRUE);
GRANT ALL ON public.boards TO service_role;

-- Create default board and migrate existing posts to it
INSERT INTO boards (slug, name) VALUES ('general', 'General') ON CONFLICT (slug) DO NOTHING;
UPDATE posts SET board_id = (SELECT id FROM boards WHERE slug = 'general') WHERE board_id IS NULL;
