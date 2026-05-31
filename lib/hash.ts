import { createHash } from 'crypto';

export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT;
  if (!salt) throw new Error('IP_SALT environment variable is not set');
  return createHash('sha256').update(ip + salt).digest('hex');
}
