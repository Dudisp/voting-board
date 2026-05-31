import type { Post } from '@/types';
import VoteButton from './VoteButton';
import { timeAgo } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  rank: number;
  onVote: () => void;
}

const rankConfig: Record<number, { wrapper: string; text: string }> = {
  1: { wrapper: 'p-6 border-2 border-gray-200 shadow-md', text: 'text-3xl font-bold' },
  2: { wrapper: 'p-5 border-2 border-gray-200 shadow-sm', text: 'text-2xl font-semibold' },
  3: { wrapper: 'p-4 border border-gray-200', text: 'text-xl font-medium' },
};

function getRankConfig(rank: number) {
  return rankConfig[rank] ?? { wrapper: 'p-3 border border-gray-100', text: 'text-base' };
}

export default function PostCard({ post, rank, onVote }: PostCardProps) {
  const { wrapper, text } = getRankConfig(rank);
  return (
    <div className={`bg-white rounded-xl relative ${wrapper}`}>
      {rank <= 3 && (
        <span className="absolute top-3 right-3 text-xs font-semibold text-gray-400">
          #{rank}
        </span>
      )}
      <p className={`text-gray-900 leading-snug mb-4 pr-8 ${text}`}>{post.content}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
        <VoteButton postId={post.id} voteCount={post.vote_count} onVote={onVote} />
      </div>
    </div>
  );
}
