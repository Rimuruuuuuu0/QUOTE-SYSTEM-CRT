import { useEffect, useState } from 'react'
import type { Product, Quote, Settings } from './types'
import { iso } from './utils'

const KEY = 'quotation-system-v1'

const seed: Product[] = [
  ['Intel Core i5-12400F', 'Processor', 8200, 6],
  ['AMD Ryzen 5 5600', 'Processor', 6900, 5],
  ['MSI B660M Motherboard', 'Motherboard', 6800, 4],
  ['Kingston Fury 16GB DDR4', 'Memory', 2400, 12],
  ['Kingston NV2 500GB NVMe SSD', 'Storage', 2100, 10],
  ['RTX 4060 8GB', 'Graphics Card', 18500, 3],
  ['650W 80+ Bronze PSU', 'Power Supply', 2800, 7],
  ['Mid-Tower ATX Case', 'Casing', 2300, 8],
  ['24" 1080p 75Hz Monitor', 'Monitor', 5400, 6],
  ['Keyboard and Mouse Combo', 'Peripherals', 650, 20],
  ['Windows 11 Pro License', 'Software', 9500, 10],
  ['PC Assembly and Testing', 'Service', 1000, 99],
].map((p, i) => ({ id: i + 1, name: p[0] as string, category: p[1] as string, price: p[2] as number, stock: p[3] as number }))

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
  vat: 12,
  validity: 7,
  prefix: 'Q',
  counter: 0,
}

function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (d) {
      const settings = { ...defaultSettings, ...(d.settings || {}) } as Settings
      if (['My Computer Store', 'My PC Store', 'My pc store'].includes(settings.store)) {
        settings.store = 'ChrisRandomTech'
      }
      return {
        products: (d.products?.length ? d.products : seed) as Product[],
        quotes: (d.quotes || []) as Quote[],
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
