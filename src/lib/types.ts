export type Category =
  | 'Processor'
  | 'Motherboard'
  | 'Memory'
  | 'Storage'
  | 'Graphics Card'
  | 'Power Supply'
  | 'Casing'
  | 'Monitor'
  | 'Peripherals'
  | 'Software'
  | 'Service'
  | 'Other'

export interface Product {
  id: number | string
  name: string
  category: string
  price: number
  stock: number
  cost?: number
}

export interface QuoteItem {
  key: string
  pid: number | string | null
  name: string
  qty: number
  price: number
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined'

export interface Quote {
  id: string | null
  no: string
  date: string
  valid: string
  customer: { name: string; contact: string; address: string }
  items: QuoteItem[]
  discount: number
  discountType: '%' | '₱'
  notes: string
  status: QuoteStatus
}

export interface Settings {
  store: string
  address: string
  contact: string
  vat: number
  validity: number
  prefix: string
  counter: number
}

export function totals(r: Pick<Quote, 'items' | 'discount' | 'discountType'>, vatPct: number) {
  const sub = r.items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)
  const d = r.discountType === '%' ? (sub * (r.discount || 0)) / 100 : r.discount || 0
  const disc = Math.min(d, sub)
  const base = sub - disc
  const vat = (base * (vatPct || 0)) / 100
  return { sub, disc, vat, total: base + vat }
}
