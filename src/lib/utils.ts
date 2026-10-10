import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function money(n: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0)
}

export const iso = (d: Date) => d.toISOString().slice(0, 10)
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

/** Local supplier photo served by the site when no custom imageUrl is set. */
export const skuPhoto = (sku?: string) => {
  const s = (sku || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return s ? `/products/${s}.jpg` : ''
}

export const photoOf = (p: { imageUrl?: string; sku?: string }) =>
  (p.imageUrl || '').trim() || skuPhoto(p.sku)
