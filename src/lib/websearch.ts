// Keyless live-web context for the chatbot. Wikipedia APIs are free,
// keyless, and browser-safe (CORS enabled). Fail-soft: '' on any error.
const clean = (q: string) =>
  q
    .replace(/(https?:\/\/\S+|www\.\S+)/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => !['what', 'whats', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how', 'is', 'are', 'was', 'were', 'do', 'does', 'did', 'can', 'could', 'should', 'the', 'a', 'an', 'of', 'for', 'vs', 'versus', 'about', 'tell', 'please', 'price', 'cheap'].includes(w.toLowerCase()))
    .slice(-8)
    .join(' ')

export async function webContext(question: string): Promise<string> {
  const q = clean(question)
  if (q.length < 3) return ''
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 9000)
    try {
      const s = await fetch(
        'https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
          encodeURIComponent(q) +
          '&srlimit=3&format=json&origin=*',
        { signal: ctrl.signal }
      )
      if (!s.ok) return ''
      const d = await s.json()
      const hits: { title: string }[] = d?.query?.search || []
      if (!hits.length) return ''
      const parts: string[] = []
      for (const h of hits.slice(0, 2)) {
        try {
          const r = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(h.title), { signal: ctrl.signal })
          if (!r.ok) continue
          const p = await r.json()
          if (p?.extract) parts.push(`${p.title}: ${String(p.extract).slice(0, 400)}`)
        } catch {
          continue
        }
      }
      return parts.join('\n').slice(0, 900)
    } finally {
      clearTimeout(timer)
    }
  } catch {
    return ''
  }
}
