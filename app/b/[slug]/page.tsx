'use client';

import { useParams } from 'next/navigation';
import BoardView from '@/components/BoardView';

export default function BoardPage() {
  const { slug } = useParams() as { slug: string };
  return <BoardView slug={slug} />;
}
