import type { Product } from './types'
import { normalizeCategory } from './categories'
import { uid } from './utils'

function splitRow(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',' || c === ';' || c === '\t') { out.push(cur.trim()); cur = '' }
    else cur += c
  }
  out.push(cur.trim())
  return out
}

const num = (v: string) => {
  const n = parseFloat((v || '').replace(/[^0-9.\-]/g, ''))
  return isNaN(n) ? 0 : n
}

export interface LoyverseResult {
  added: number
  updated: number
  skipped: number
  products: Product[]
}

/** Parse a Loyverse Back Office items export CSV and merge into existing products. */
export function importLoyverseCsv(text: string, existing: Product[]): LoyverseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return { added: 0, updated: 0, skipped: 0, products: existing }
  const head = splitRow(lines[0]).map((h) => h.toLowerCase())

  const col = (names: string[], exclude?: string[]) => {
    for (let i = 0; i < head.length; i++) {
      const h = head[i]
      if (exclude && exclude.some((e) => h.includes(e))) continue
      if (names.some((n) => h === n || h.startsWith(n + ' ') || h.startsWith(n + '['))) return i
    }
    return -1
  }

  const iName = col(['name'], ['option'])
  const iCat = col(['category'])
  const iCost = col(['cost'], ['purchase'])
  let iPrice = head.indexOf('default price')
  if (iPrice < 0) iPrice = col(['price'])
  let iStock = col(['in stock'])
  const iComp = col(['sku of included item'])
  const iOpt1 = head.indexOf('option 1 value')
  const iOpt2 = head.indexOf('option 2 value')
  const iOpt3 = head.indexOf('option 3 value')
  const iSku = col(['sku'], ['included'])

  if (iName < 0) throw new Error('No Name column found. Use the Loyverse Back Office Item list Export file.')

  const splitVariant = (n: string): { name: string; variant: string } => {
    const m = n.match(/^(.*)\s+\(([^()]+)\)\s*$/)
    if (m) return { name: m[1].trim(), variant: m[2].trim() }
    return { name: n, variant: '' }
  }
  const keyOf = (n: string, v: string) => `${n.trim().toLowerCase()}|||${(v || '').trim().toLowerCase()}`
  const byName = new Map(existing.map((p) => [keyOf(p.name, p.variant || ''), p]))
  const products = [...existing]
  let added = 0, updated = 0, skipped = 0
  let parentName = '', parentCat = ''

  for (let r = 1; r < lines.length; r++) {
    const cells = splitRow(lines[r])
    let rawName = (cells[iName] || '').trim()
    if (rawName) {
      parentName = rawName
      if (iCat >= 0 && (cells[iCat] || '').trim()) parentCat = (cells[iCat] || '').trim()
    }
    if (iComp >= 0 && (cells[iComp] || '').trim()) { skipped++; continue } // composite component row
    const opts = [iOpt1, iOpt2, iOpt3]
      .filter((i) => i >= 0)
      .map((i) => (cells[i] || '').trim())
      .filter(Boolean)
    let base = rawName || parentName
    let variant = opts.join(' / ')
    if (!base && !variant) { skipped++; continue }
    if (!rawName && parentName) base = parentName
    // fixed file from Python already has "Name (Variant)" — split it back apart
    if (rawName && !variant) {
      const s = splitVariant(rawName)
      base = s.name
      variant = s.variant
    }
    const name = base.trim()
    if (!name) { skipped++; continue }
    const sku = iSku >= 0 ? (cells[iSku] || '').trim() : ''
    const category = normalizeCategory(name, ((iCat >= 0 ? cells[iCat] || '' : '').trim() || parentCat || 'Other'))
    const price = iPrice >= 0 ? num(cells[iPrice]) : 0
    const cost = iCost >= 0 ? num(cells[iCost]) : 0
    const stock = iStock >= 0 ? Math.round(num(cells[iStock])) : 0

    const key = keyOf(name, variant)
    const ex = byName.get(key)
    if (ex) {
      ex.price = price || ex.price
      ex.category = category !== 'Other' ? category : ex.category
      ex.variant = variant || ex.variant || ''
      if (sku) ex.sku = sku
      // never overwrite an existing photo with blank on re-import
      if (iStock >= 0) ex.stock = stock
      if (cost) ex.cost = cost
      updated++
    } else {
      const p: Product = { id: uid(), name, variant, category, price, stock }
      if (sku) p.sku = sku
      if (cost) p.cost = cost
      products.unshift(p)
      byName.set(key, p)
      added++
    }
  }
  return { added, updated, skipped, products }
}
