// Optional BYO-key Gemini brain. Key stays in the user's own browser
// (localStorage only, never saved to Firestore). Free tier limits apply.
import type { Product } from './types'

const SYS = `You are the shop assistant for ChrisRandomTech, a PC shop in the Philippines.
Answer ONLY computer-related questions: parts, builds, compatibility, repairs,
troubleshooting, prices, stock. If asked anything else, reply exactly:
"I only answer computer and shop questions."
Keep answers short (under 120 words), practical, peso prices. Never invent stock.`

export async function askGemini(key: string, question: string, products: Product[], webCtx = ''): Promise<string> {
  const inStock = products
    .filter((p) => p.stock > 0)
    .slice(0, 150)
    .map((p) => `- ${p.name}${p.variant ? ` (${p.variant})` : ''} | ${p.category} | ₱${p.price} | stock ${p.stock}`)
    .join('\n')
  const body = {
    system_instruction: { parts: [{ text: SYS }] },
    contents: [{ parts: [{ text: `In-stock catalog:\n${inStock}${webCtx ? `\n\nLive web context:\n${webCtx}` : ''}\n\nCustomer: ${question}` }] }],
    generationConfig: { maxOutputTokens: 400, temperature: 0.4 },
  }
  // Model ids retire often — try newest first, fall through on 404.
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  let lastErr = ''
  for (const m of models) {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + m + ':generateContent?key=' + encodeURIComponent(key.trim()),
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
    if (res.ok) {
      const d = await res.json()
      const text = d?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('').trim()
      if (text) return text
      throw new Error('Empty answer. Try again.')
    }
    if (res.status === 400) throw new Error('Key rejected. Check the key in Settings.')
    if (res.status === 429) throw new Error('Free limit hit. Wait a minute or turn off Smart answers.')
    lastErr = 'Gemini error ' + res.status
    if (res.status !== 404) throw new Error(lastErr)
  }
  throw new Error(lastErr || 'Gemini error 404')
}
