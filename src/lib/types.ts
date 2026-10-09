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
  /** Supplier base price (cost). */
  cost: number
  /** Markup % over cost used to compute SRP. */
  margin: number
  /** Selling price (SRP). */
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
  /** Default markup % over supplier cost. */
  markup: number
  validity: number
  prefix: string
  counter: number
}

/** SRP from supplier cost + markup %. Rounded to whole pesos. */
export function srp(cost: number, margin: number) {
  return Math.round((cost || 0) * (1 + (margin || 0) / 100))
}

export function totals(r: Pick<Quote, 'items' | 'discount' | 'discountType'>) {
  const sub = r.items.reduce((s, i) => s + (i.qty || 0) * (i.price || 0), 0)
  const cost = r.items.reduce((s, i) => s + (i.qty || 0) * (i.cost || 0), 0)
  const d = r.discountType === '%' ? (sub * (r.discount || 0)) / 100 : r.discount || 0
  const disc = Math.min(d, sub)
  const total = sub - disc
  return { sub, disc, cost, total, profit: total - cost }
}
