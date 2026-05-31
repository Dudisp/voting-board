import React from 'react';
import type { Post } from '@/types';
import VoteButton from './VoteButton';
import { timeAgo } from '@/lib/utils';

const URL_REGEX = /https?:\/\/[^\s]+/g;

function renderWithLinks(text: string) {
  const parts: (string | React.ReactElement)[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  URL_REGEX.lastIndex = 0;
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        style={{ textDecoration: 'underline', opacity: 0.7, wordBreak: 'break-all' }}
      >
        {match[0]}
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface PostCardProps {
  post: Post;
  rank: number;
  onVote: () => void;
  position: { x: number; y: number };
  size: { w: number; h: number };
  rotation: number;
  fontSize: number;
  color: string;
  sideNote?: boolean;
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
  sideNote,
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
          zIndex: sideNote ? 1 : Math.max(0, 25 - rank),
          opacity: sideNote ? 0.82 : 1,
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

      {/* Rank / discovery badge */}
      <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.45, marginBottom: 4 }}>
        {sideNote ? '✨' : `#${rank}`}
      </div>

      {/* Content */}
      <div
        dir="auto"
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
        {renderWithLinks(post.content)}
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
