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

  if (iName < 0) throw new Error('No Name column found. Use the Loyverse Back Office Item list Export file.')

  const byName = new Map(existing.map((p) => [p.name.trim().toLowerCase(), p]))
  const products = [...existing]
  let added = 0, updated = 0, skipped = 0

  for (let r = 1; r < lines.length; r++) {
    const cells = splitRow(lines[r])
    const name = (cells[iName] || '').trim()
    if (!name) { skipped++; continue }
    if (iComp >= 0 && (cells[iComp] || '').trim()) { skipped++; continue } // composite component row
    const category = normalizeCategory(name, (iCat >= 0 ? cells[iCat] || '' : '').trim() || 'Other')
    const price = iPrice >= 0 ? num(cells[iPrice]) : 0
    const cost = iCost >= 0 ? num(cells[iCost]) : 0
    const stock = iStock >= 0 ? Math.round(num(cells[iStock])) : 0

    const key = name.toLowerCase()
    const ex = byName.get(key)
    if (ex) {
      ex.price = price || ex.price
      ex.category = category !== 'Other' ? category : ex.category
      if (iStock >= 0) ex.stock = stock
      if (cost) ex.cost = cost
      updated++
    } else {
      const p: Product = { id: uid(), name, category, price, stock }
      if (cost) p.cost = cost
      products.unshift(p)
      byName.set(key, p)
      added++
    }
  }
  return { added, updated, skipped, products }
}
