type SlidingWindow = Map<string, number>

const windows = new Map<string, number[]>()
const distinctWindows = new Map<string, SlidingWindow>()

function pruneWindows(now: number): void {
  if (windows.size < 5000 && distinctWindows.size < 5000) return
  for (const [key, events] of windows) {
    if (!events.length || events[events.length - 1] <= now - 60 * 60 * 1000) windows.delete(key)
  }
  for (const [key, values] of distinctWindows) {
    for (const [value, timestamp] of values) {
      if (timestamp <= now - 24 * 60 * 60 * 1000) values.delete(value)
    }
    if (!values.size) distinctWindows.delete(key)
  }
}

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  pruneWindows(now)
  const events = (windows.get(key) ?? []).filter((timestamp) => timestamp > now - windowMs)
  if (events.length >= limit) {
    windows.set(key, events)
    return { ok: false, retryAfterMs: Math.max(0, events[0] + windowMs - now) }
  }
  events.push(now)
  windows.set(key, events)
  return { ok: true, retryAfterMs: 0 }
}

export function distinctRateLimit(
  key: string,
  value: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  pruneWindows(now)
  let values = distinctWindows.get(key)
  if (!values) {
    values = new Map()
    distinctWindows.set(key, values)
  }
  for (const [existingValue, timestamp] of values) {
    if (timestamp <= now - windowMs) values.delete(existingValue)
  }
  if (values.has(value)) return { ok: true, retryAfterMs: 0 }
  if (values.size >= limit) {
    const firstSeen = Math.min(...values.values())
    return { ok: false, retryAfterMs: Math.max(0, firstSeen + windowMs - now) }
  }
  values.set(value, now)
  return { ok: true, retryAfterMs: 0 }
}
