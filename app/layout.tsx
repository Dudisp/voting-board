import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voting Board',
  description: 'A real-time public voting board. Post a message and let the crowd upvote.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
