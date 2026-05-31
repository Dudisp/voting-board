import type { Post } from '@/types';
import VoteButton from './VoteButton';
import { timeAgo } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  rank: number;
  onVote: () => void;
  position: { x: number; y: number };
  size: { w: number; h: number };
  rotation: number;
  fontSize: number;
  color: string;
  animated?: boolean;
}

export default function PostCard({
  post,
  rank,
  onVote,
  position,
  size,
  rotation,
  fontSize,
  color,
  animated,
}: PostCardProps) {
  return (
    <div
      className={`sticky-note${animated ? ' note-enter' : ''}`}
      style={
        {
          position: 'absolute',
          left: position.x,
          top: position.y,
          width: size.w,
          minHeight: size.h,
          background: color,
          transform: `rotate(${rotation}deg)`,
          '--note-rot': `${rotation}deg`,
          zIndex: Math.max(0, 25 - rank),
          borderRadius: 4,
          padding: '12px 13px 10px',
          boxShadow: '3px 4px 12px rgba(0,0,0,0.18), 1px 1px 3px rgba(0,0,0,0.09)',
          cursor: 'default',
          userSelect: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
        } as React.CSSProperties
      }
    >
      {/* Tab strip */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'rgba(0,0,0,0.07)',
          borderRadius: '4px 4px 0 0',
        }}
      />

      {/* Rank */}
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.4, marginBottom: 4 }}>
        #{rank}
      </div>

      {/* Content */}
      <div
        style={{
          fontSize,
          fontWeight: 500,
          lineHeight: 1.35,
          color: 'rgba(0,0,0,0.76)',
          wordBreak: 'break-word',
          overflow: 'hidden',
          maxHeight: size.h - 56,
        }}
      >
        {post.content}
      </div>

      {/* Meta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8,
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.38)', flexShrink: 0 }}>
          {timeAgo(post.created_at)}
        </span>
        <VoteButton postId={post.id} voteCount={post.vote_count} onVote={onVote} variant="note" />
      </div>
    </div>
  );
}
