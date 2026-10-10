import type { Product, Quote } from './types'
import { srp } from './types'
import { isComputerRelated, kbAnswer, OFFTOPIC } from './computerKB'

export interface Pick {
  product: Product
  qty: number
  reason?: string
}

export interface AssistResult {
  reply: string
  picks: Pick[]
  warnings: string[]
  total: number
}

const SYN: Record<string, string[]> = {
  ram: ['ram', 'memory', 'ddr3', 'ddr4', 'ddr5', 'udimm', 'sodimm'],
  gpu: ['gpu', 'graphics', 'video', 'videocard', 'rtx', 'gtx', 'radeon', 'rx', 'arc'],
  psu: ['psu', 'power', 'supply', 'watts', 'watt', 'bronze', 'gold'],
  cpu: ['cpu', 'processor', 'ryzen', 'athlon', 'intel', 'celeron', 'pentium'],
  motherboard: ['motherboard', 'mobo', 'mainboard', 'b550', 'a520', 'b660', 'h610', 'b760'],
  storage: ['ssd', 'hdd', 'storage', 'nvme', 'sata', 'm.2'],
  casing: ['case', 'casing', 'chassis', 'tower', 'atx', 'matx'],
  monitor: ['monitor', 'screen', 'display'],
  cooling: ['fan', 'cooler', 'cooling', 'aio', 'heatsink', 'thermal'],
  peripherals: ['keyboard', 'mouse', 'kbm', 'headset', 'keypad'],
  laptop: ['laptop', 'notebook'],
}

const expandTokens = (toks: string[]): Set<string> => {
  const out = new Set<string>()
  for (const t of toks) {
    out.add(t)
    for (const [k, vs] of Object.entries(SYN)) {
      if (k === t || vs.includes(t)) vs.forEach((v) => out.add(v))
    }
  }
  return out
}

const words = (s: string) =>
  (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => w.length >= 2)

const edit1 = (a: string, b: string) => {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0,
    j = 0,
    edits = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++
      j++
    } else {
      if (++edits > 1) return false
      if (a.length > b.length) i++
      else if (b.length > a.length) j++
      else {
        i++
        j++
      }
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1
}

export const parseBudget = (text: string): number | null => {
  const t = text.toLowerCase().replace(/,/g, '')
  const k = t.match(/(\d+(?:\.\d+)?)\s*k\b/)
  if (k) return Math.round(parseFloat(k[1]) * 1000)
  const p = t.match(/(?:₱|php|pesos?)\s*(\d+(?:\.\d+)?)/) || t.match(/(\d+(?:\.\d+)?)\s*(?:pesos?|php)/)
  if (p) return Math.round(parseFloat(p[1]))
  const b = t.match(/budget\s*(\d+(?:\.\d+)?)/)
  if (b) return Math.round(parseFloat(b[1]))
  return null
}

const ddrOf = (s: string) => {
  const m = s.toLowerCase().match(/ddr\s*([345])/)
  return m ? 'DDR' + m[1] : null
}
const cpuBrand = (s: string) => {
  const t = s.toLowerCase()
  if (t.includes('ryzen') || t.includes('athlon') || t.includes('am4') || t.includes('am5')) return 'AMD'
  if (/\bi[3579]\b/.test(t) || t.includes('intel') || t.includes('celeron') || t.includes('pentium') || t.includes('lga')) return 'Intel'
  return null
}
const boardBrand = (s: string) => {
  const t = s.toLowerCase()
  if (/(b550|a520|x570|b650|a620)/.test(t)) return 'AMD'
  if (/(b660|h610|b760|z790|h510|b560)/.test(t)) return 'Intel'
  return null
}

const scoreProduct = (p: Product, qtoks: Set<string>): number => {
  const hay = `${p.name} ${p.variant || ''} ${p.category}`.toLowerCase()
  const hw = new Set(hay.match(/[a-z0-9]+/g) || [])
  let score = 0
  for (const q of qtoks) {
    if (q.length < 2) continue
    if (hay.includes(q)) score += q.length >= 5 ? 3 : 2
    else if (q.length >= 5) {
      for (const h of hw) {
        if (edit1(q, h)) {
          score += 1
          break
        }
      }
    }
  }
  return score
}

export function reorderList(products: Product[], at = 2) {
  return products
    .filter((p) => (p.category !== 'Service' ? p.stock <= at : false))
    .sort((a, b) => a.stock - b.stock)
}

export function assistQuery(text: string, products: Product[], quotes: Quote[], markup: number): AssistResult {
  const warnings: string[] = []
  const t = text.toLowerCase().trim()
  if (!t) return { reply: 'Tell me what to find — e.g. "8GB DDR4 under ₱2000" or "gaming build under 50k".', picks: [], warnings, total: 0 }

  // 1. reorder question
  if (/reorder|restock|low.?stock|running.?out|ubos/.test(t)) {
    const low = reorderList(products).slice(0, 15)
    if (!low.length) return { reply: 'No items at or below reorder level. Stock looks healthy.', picks: [], warnings, total: 0 }
    const cost = low.reduce((s, p) => s + (p.cost || 0) * Math.max(0, 3 - p.stock), 0)
    return {
      reply: `${low.length} item(s) need reorder (≤2 left). Top: ${low.slice(0, 5).map((p) => `${p.name}${p.variant ? ` (${p.variant})` : ''} — ${p.stock} left`).join('; ')}. Restock cost to 3pcs ≈ ₱${cost.toLocaleString()}.`,
      picks: low.slice(0, 8).map((product) => ({ product, qty: Math.max(0, 3 - product.stock) || 1, reason: 'reorder' })),
      warnings,
      total: 0,
    }
  }

  // 2. repeat-customer recall
  const again = t.match(/(?:same as|last|reorder|repeat|again)(?:.+for)?\s+([a-z][a-z .]{2,40})/)
  const forName = t.match(/for\s+([a-z][a-z .]{2,40})/)
  const who = (again?.[1] || (/again|same as|last time/.test(t) && forName?.[1]) || '').trim()
  if (/again|same as|last time|reorder for|repeat/.test(t) || who) {
    const cands = quotes.filter((q) => (q.customer?.name || '').toLowerCase().includes(who || '~~~'))
    const target = (who ? cands : quotes)[0]
    if (target) {
      const picks: Pick[] = []
      for (const it of target.items || []) {
        const p = products.find((x) => x.id === it.pid) || products.find((x) => x.name.toLowerCase() === (it.name || '').toLowerCase())
        if (p) picks.push({ product: p, qty: it.qty || 1, reason: `from ${target.no}` })
      }
      if (picks.length) {
        const total = picks.reduce((s, x) => s + x.product.price * x.qty, 0)
        return { reply: `Found ${target.no} for ${target.customer?.name} — ${picks.length} line(s), ≈ ₱${total.toLocaleString()}. Tap below to load into the quote.`, picks, warnings, total }
      }
    }
    if (who) return { reply: `No saved quote found for "${who}". Try the customer name as saved, or describe the items.`, picks: [], warnings, total: 0 }
  }

  // 2b. head-to-head compare — real catalog prices, never canned loops
  const compHit = /\bvs\.?\b|versus|difference|compare|cheaper|expensive|better|which one|\bor\b/i.test(t)
  if (compHit) {
    const q2 = expandTokens(words(t))
    const ranked = products
      .map((p) => ({ p, s: scoreProduct(p, q2) }))
      .filter((x) => x.s >= 4)
      .sort((a, b) => b.s - a.s)
    const distinct = ranked.filter((r, i, a) => a.findIndex((x) => x.p.name.toLowerCase() === r.p.name.toLowerCase()) === i).slice(0, 2)
    if (distinct.length === 2) {
      const [A, B] = distinct.map((x) => x.p)
      const diff = Math.abs(A.price - B.price)
      const cheap = A.price <= B.price ? A : B
      const pricey = A.price <= B.price ? B : A
      const cmpWarn: string[] = []
      if (cheap.stock <= 0) cmpWarn.push(`${cheap.name} is out of stock — check alternatives below.`)
      const ddrA = ddrOf(`${A.name} ${A.variant || ''}`)
      const ddrB = ddrOf(`${B.name} ${B.variant || ''}`)
      if (ddrA && ddrB && ddrA !== ddrB) cmpWarn.push(`${A.name} is ${ddrA}, ${B.name} is ${ddrB} — different boards needed.`)
      const reply =
        `${A.name}${A.variant ? ` (${A.variant})` : ''} — ₱${A.price.toLocaleString()} (${A.stock} in stock) vs ` +
        `${B.name}${B.variant ? ` (${B.variant})` : ''} — ₱${B.price.toLocaleString()} (${B.stock} in stock). ` +
        `Gap: ₱${diff.toLocaleString()}. ` +
        (cheap.stock > 0
          ? `${cheap.name} is the value pick — same-class performance for less. Take ${pricey.name} only if the client wants top clocks/box cooler differences.`
          : `Cheaper option is out of stock, so ${pricey.name} is the quotable one today.`) +
        ` Turn Smart answers on for a full spec explanation.`
      return {
        reply,
        picks: distinct.map((x) => ({ product: x.p, qty: 1 })),
        warnings: cmpWarn,
        total: A.price + B.price,
      }
    }
  }

  // 3. computer knowledge (offline, ChatGPT-style Q&A limited to computers)
  const kb = kbAnswer(t)
  if (kb) return { reply: kb, picks: [], warnings, total: 0 }
  if (OFFTOPIC.test(t)) {
    return { reply: 'I only answer computer and shop questions (parts, builds, repairs, prices, stock). Ask me about those!', picks: [], warnings, total: 0 }
  }

  // 3b. product search / build
  const budget = parseBudget(t)
  const qtoks = expandTokens(words(t).filter((w) => !['under', 'below', 'above', 'over', 'with', 'and', 'for', 'the', 'find', 'search', 'need', 'want', 'gaming', 'build', 'quote', 'price', 'cheap', 'budget'].includes(w)))
  const scored = products
    .map((p) => ({ p, s: scoreProduct(p, qtoks) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || (b.p.stock > 0 ? 1 : 0) - (a.p.stock > 0 ? 1 : 0) || a.p.price - b.p.price)

  if (!scored.length) {
    if (!isComputerRelated(t)) {
      return { reply: 'I only answer computer and shop questions (parts, builds, repairs, prices, stock). Rephrase with computer words and I will help.', picks: [], warnings, total: 0 }
    }
    return { reply: 'Good question — I do not have a ready answer for that one yet. Try a part ("what PSU for RTX 4060?"), a problem ("PC has no display"), or catalog words ("Ryzen", "DDR4 8GB", "B550").', picks: [], warnings, total: 0 }
  }

  // dedupe variants of same base: keep best 2 per base name unless query names variant
  const wantsVariant = /(white|black|rgb|8gb|16gb|32gb|2400|2666|3200|\d+\s*gb)/.test(t)
  const seen = new Map<string, number>()
  const picks: Pick[] = []
  for (const { p } of scored) {
    if (picks.length >= 8) break
    const base = p.name.toLowerCase()
    const n = seen.get(base) || 0
    if (!wantsVariant && n >= 1) continue
    if (n >= 2) continue
    seen.set(base, n + 1)
    if (p.stock <= 0) {
      const alt = products.find((x) => x.category === p.category && x.stock > 0 && scoreProduct(x, qtoks) > 0)
      if (alt && !picks.some((k) => k.product.id === alt.id)) {
        picks.push({ product: alt, qty: 1, reason: `in-stock swap for out-of-stock ${p.name}` })
        warnings.push(`${p.name} is out of stock — swapped to ${alt.name}${alt.variant ? ` (${alt.variant})` : ''}.`)
        continue
      }
      warnings.push(`${p.name}${p.variant ? ` (${p.variant})` : ''} is out of stock.`)
    }
    picks.push({ product: p, qty: 1 })
  }

  // 4. compatibility + psu guard
  const names = picks.map((x) => `${x.product.name} ${x.product.variant || ''}`.toLowerCase())
  const ddr = new Set(names.map(ddrOf).filter(Boolean))
  if (ddr.size > 1) warnings.push(`Mixed RAM generations (${[...ddr].join(' vs ')}) — boards take one. Confirm before quoting.`)
  const cpus = names.map(cpuBrand).filter(Boolean)
  const boards = names.map(boardBrand).filter(Boolean)
  if (cpus.length && boards.length && new Set(cpus).size === 1 && new Set(boards).size === 1 && cpus[0] !== boards[0]) {
    const cpu = picks.find((x) => cpuBrand(`${x.product.name} ${x.product.variant || ''}`))
    const bd = picks.find((x) => boardBrand(`${x.product.name} ${x.product.variant || ''}`))
    warnings.push(`Mismatch: ${cpu?.product.name} is ${cpus[0]} but ${bd?.product.name} is a ${boards[0]} board. Swap one.`)
  }
  const hasGpu = picks.some((x) => /rtx|gtx|radeon|\brx\b|arc|gpu/.test(`${x.product.name} ${x.product.category}`.toLowerCase()))
  const hasPsu = picks.some((x) => x.product.category === 'PSU')
  if (hasGpu && !hasPsu) {
    const psu = products.filter((p) => p.category === 'PSU' && p.stock > 0).sort((a, b) => a.price - b.price)[0]
    if (psu) {
      picks.push({ product: psu, qty: 1, reason: 'PSU guard for GPU build' })
      warnings.push(`GPU build without PSU — added cheapest in-stock ${psu.name} (${psu.variant || 'standard'}). Remove if client reuses theirs.`)
    } else warnings.push('GPU build without PSU and no PSU in stock — confirm client has one.')
  }

  // 5. margin guard
  for (const x of picks) {
    const c = x.product.cost || 0
    if (c > 0 && x.product.price < c) warnings.push(`Losing price: ${x.product.name} SRP ₱${x.product.price.toLocaleString()} below cost ₱${c.toLocaleString()}.`)
    else if (c > 0 && (x.product.price - c) / x.product.price < 0.1) {
      const sug = srp(c, markup || 20)
      warnings.push(`Thin margin on ${x.product.name} — suggested SRP at ${markup || 20}% is ₱${sug.toLocaleString()}.`)
    }
  }

  let total = picks.reduce((s, x) => s + x.product.price * x.qty, 0)
  let reply: string
  if (budget && total > budget) {
    reply = `Best match is ₱${total.toLocaleString()} — over your ₱${budget.toLocaleString()} budget by ₱${(total - budget).toLocaleString()}. Cheapest swaps applied where possible; drop a line or raise budget.`
  } else if (budget) {
    reply = `${picks.length} item(s), ₱${total.toLocaleString()} — within ₱${budget.toLocaleString()} budget. Tap below to add all to the quote.`
  } else {
    reply = picks.length === 1
      ? `${picks[0].product.name}${picks[0].product.variant ? ` (${picks[0].product.variant})` : ''} — ₱${picks[0].product.price.toLocaleString()}, ${picks[0].product.stock} in stock.`
      : `${picks.length} matches, ₱${total.toLocaleString()} total. Tap below to add all to the quote.`
  }
  return { reply, picks, warnings, total }
}
