import { useEffect, useState } from 'react'
import type { Product, Quote, QuoteItem, Settings } from './types'
import { normalizeCategory } from './categories'
import { iso } from './utils'

const KEY = 'quotation-system-v1'

const seed: Product[] = []

export const blankQuote = (): Quote => ({
  id: null,
  no: '',
  date: '',
  valid: '',
  customer: { name: '', contact: '', address: '' },
  items: [],
  discount: 0,
  discountType: '%',
  notes: 'Prices are subject to change without notice. Warranty per manufacturer terms.',
  status: 'Draft',
})

const defaultSettings: Settings = {
  store: 'ChrisRandomTech',
  address: '',
  contact: '',
  markup: 20,
  validity: 7,
  prefix: 'Q',
  counter: 0,
}

const CAT_FIX: Record<string, string> = {
  'Processor': 'CPU',
  'Memory': 'RAM',
  'Graphics Card': 'GPU',
  'Power Supply': 'PSU',
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (d) {
      const settings = { ...defaultSettings, ...(d.settings || {}) } as Settings
      if (['My Computer Store', 'My PC Store', 'My pc store'].includes(settings.store)) {
        settings.store = 'ChrisRandomTech'
      }
      const products = ((Array.isArray(d.products) && d.products.length ? d.products : seed) as Product[])
        .filter((p) => p && typeof p.name === 'string')
        .map((p) => ({
          ...p,
          category: normalizeCategory(p.name, CAT_FIX[p.category] || p.category),
        }))
      const quotes = ((Array.isArray(d.quotes) ? d.quotes : []) as Quote[])
        .filter((r) => r && typeof r === 'object')
        .map((r) => ({
          ...r,
          customer: { name: '', contact: '', address: '', ...(r.customer && typeof r.customer === 'object' ? r.customer : {}) },
          items: (Array.isArray(r.items) ? r.items : []).map((it: QuoteItem) => ({
            ...it,
            cost: it.cost ?? 0,
            margin: it.margin ?? settings.markup ?? 20,
          })),
        }))
      return {
        products,
        quotes,
        settings,
      }
    }
  } catch {}
  return { products: seed, quotes: [] as Quote[], settings: defaultSettings }
}

export function newQuoteNo(settings: Settings) {
  const n = (settings.counter || 0) + 1
  const now = new Date()
  const v = new Date(Date.now() + settings.validity * 864e5)
  return {
    no: `${settings.prefix}-${now.getFullYear()}-${String(n).padStart(4, '0')}`,
    date: iso(now),
    valid: iso(v),
  }
}

export function useStore() {
  const [initial] = useState(load)
  const [products, setProducts] = useState<Product[]>(initial.products)
  const [quotes, setQuotes] = useState<Quote[]>(initial.quotes)
  const [settings, setSettings] = useState<Settings>(initial.settings)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ products, quotes, settings }))
    } catch {}
  }, [products, quotes, settings])

  return { products, setProducts, quotes, setQuotes, settings, setSettings }
}
