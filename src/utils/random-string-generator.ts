import { randomBytes } from 'crypto';

export function randomStringGenerator(): string {
  return randomBytes(32).toString('hex');
}
