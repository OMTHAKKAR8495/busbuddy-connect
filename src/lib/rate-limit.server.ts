// This process-local sliding window is a development fallback. Production must use Upstash Redis or WAF rules.
const events = new Map<string, number[]>();

export function enforceRateLimit(key: string, limit: number, windowMs: number, now = Date.now()) {
  const cutoff = now - windowMs;
  const recent = (events.get(key) ?? []).filter((timestamp) => timestamp > cutoff);
  if (recent.length >= limit) throw new Error("Too many requests. Try again later.");
  recent.push(now);
  events.set(key, recent);
}
