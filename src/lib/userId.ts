const KEY = 'memgateqa_user_id';

export function getUserId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = `user-${crypto.randomUUID().slice(0, 12)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return 'user-anonymous';
  }
}