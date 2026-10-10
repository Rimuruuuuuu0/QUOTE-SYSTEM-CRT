// Keyless free AI brain (public free tier). No key, no backend.
// Falls back to offline answers on any failure.
import type { Product } from './types'

const SYS = `You are the shop assistant for ChrisRandomTech, a PC shop in the Philippines.
Answer ONLY computer-related questions: parts, builds, compatibility, repairs,
troubleshooting, prices, stock. If asked anything else, reply exactly:
"I only answer computer and shop questions."
Keep answers short (under 120 words), practical, peso prices. Never invent stock.
Use the live web context when relevant; otherwise use your own knowledge.`

export async function askFreeAI(question: string, products: Product[], webCtx = ''): Promise<string> {
  const inStock = products
    .filter((p) => p.stock > 0)
    .slice(0, 120)
    .map((p) => `- ${p.name}${p.variant ? ` (${p.variant})` : ''} | ${p.category} | P${p.price} | stock ${p.stock}`)
    .join('\n')
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 45000)
  try {
    const res = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: SYS },
          { role: 'user', content: `In-stock catalog:\n${inStock}${webCtx ? `\n\nLive web context:\n${webCtx}` : ''}\n\nCustomer: ${question}` },
        ],
      }),
    })
    if (!res.ok) throw new Error(res.status === 429 ? 'Free AI busy. Try again in a minute.' : 'Free AI error ' + res.status)
    const d = await res.json()
    const text = (d?.choices?.[0]?.message?.content || '').trim()
    if (!text) throw new Error('Empty answer. Try again.')
    return text
  } finally {
    clearTimeout(timer)
  }
}
