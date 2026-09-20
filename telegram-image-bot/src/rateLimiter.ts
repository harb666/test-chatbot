/**
 * Tiny in-memory per-user cooldown. Good enough for a single-process bot;
 * resets on restart, which is fine since it only guards against spamming
 * the free image endpoint.
 */
export class RateLimiter {
  private lastRequestAt = new Map<number, number>();

  constructor(private cooldownMs: number) {}

  /** Returns 0 if the user may proceed, or the remaining wait in seconds. */
  check(userId: number): number {
    const now = Date.now();
    const last = this.lastRequestAt.get(userId) ?? 0;
    const elapsed = now - last;
    if (elapsed >= this.cooldownMs) {
      this.lastRequestAt.set(userId, now);
      return 0;
    }
    return Math.ceil((this.cooldownMs - elapsed) / 1000);
  }
}
