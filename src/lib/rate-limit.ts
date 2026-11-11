type RateWindow = { count: number; expiresAt: number }

const windows = new Map<string, RateWindow>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const current = windows.get(key)

  if (!current || current.expiresAt <= now) {
    windows.set(key, { count: 1, expiresAt: now + windowMs })
    return { ok: true, retryAfterMs: 0 }
  }

  if (current.count >= limit) {
    return { ok: false, retryAfterMs: Math.max(0, current.expiresAt - now) }
  }

  current.count += 1
  return { ok: true, retryAfterMs: 0 }
}
