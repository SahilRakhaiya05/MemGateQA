import { readLocal, writeLocal } from './safeStorage';

const KEY = 'memgateqa_user_id';

export function getUserId(): string {
  let id = readLocal(KEY);
  if (!id) {
    try {
      id = `user-${crypto.randomUUID().slice(0, 12)}`;
    } catch {
      id = 'user-anonymous';
    }
    writeLocal(KEY, id);
  }
  return id;
}