import type { Post } from '@/types';
import VoteButton from './VoteButton';
import { timeAgo } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  rank: number;
  onVote: () => void;
}

const rankConfig: Record<number, { wrapper: string; text: string; rotate: string }> = {
  1: {
    wrapper: 'p-6 border-2 border-gray-200 shadow-lg rounded-2xl',
    text: 'text-2xl font-bold',
    rotate: '',
  },
  2: {
    wrapper: 'p-4 border border-gray-200 shadow-sm rounded-2xl',
    text: 'text-base font-medium',
    rotate: '-rotate-1',
  },
  3: {
    wrapper: 'p-4 border border-gray-200 shadow-sm rounded-2xl',
    text: 'text-base font-medium',
    rotate: 'rotate-1',
  },
};

function getRankConfig(rank: number) {
  return (
    rankConfig[rank] ?? {
      wrapper: 'p-3 border border-gray-100 rounded-xl',
      text: 'text-xs',
      rotate: '',
    }
  );
}

export default function PostCard({ post, rank, onVote }: PostCardProps) {
  const { wrapper, text, rotate } = getRankConfig(rank);
  const isSmall = rank > 3;

  return (
    <div className={`bg-white relative ${wrapper} ${rotate}`}>
      {rank <= 3 && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-gray-300">
          #{rank}
        </span>
      )}
      <p className={`text-gray-900 leading-snug mb-3 ${text} ${isSmall ? 'line-clamp-4' : 'pr-8'}`}>
        {post.content}
      </p>
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs text-gray-400 truncate">{timeAgo(post.created_at)}</span>
        <VoteButton postId={post.id} voteCount={post.vote_count} onVote={onVote} small={isSmall} />
      </div>
    </div>
  );
}
