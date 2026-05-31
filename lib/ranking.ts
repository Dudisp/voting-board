const GRAVITY = 1.8;

export function calculateScore(voteCount: number, createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  return voteCount / Math.pow(Math.max(ageHours, 0) + 2, GRAVITY);
}
