export const CATS = [
  'CPU',
  'Motherboard',
  'RAM',
  'Storage',
  'GPU',
  'PSU',
  'Casing',
  'Cooling',
  'Monitor',
  'Peripherals',
  'Accessories',
  'Laptop',
  'Software',
  'Service',
  'Other',
]

const ALIAS: Record<string, string> = {
  'video card': 'GPU',
  'videocard': 'GPU',
  'video-card': 'GPU',
  'graphics card': 'GPU',
  'vga': 'GPU',
  'gpu': 'GPU',
  'graphics': 'GPU',
  'processor': 'CPU',
  'cpu': 'CPU',
  'memory': 'RAM',
  'ram': 'RAM',
  'power supply': 'PSU',
  'powersupply': 'PSU',
  'psu': 'PSU',
  'mainboard': 'Motherboard',
  'mobo': 'Motherboard',
  'motherboard': 'Motherboard',
  'storage': 'Storage',
  'hdd': 'Storage',
  'ssd': 'Storage',
  'hard drive': 'Storage',
  'casing': 'Casing',
  'case': 'Casing',
  'chassis': 'Casing',
  'tower': 'Casing',
  'cooler': 'Cooling',
  'cooling': 'Cooling',
  'fan': 'Cooling',
  'heatsink': 'Cooling',
  'monitor': 'Monitor',
  'display': 'Monitor',
  'screen': 'Monitor',
  'keyboard': 'Peripherals',
  'mouse': 'Peripherals',
  'peripherals': 'Peripherals',
  'peripheral': 'Peripherals',
  'laptop': 'Laptop',
  'notebook': 'Laptop',
  'software': 'Software',
  'service': 'Service',
  'accessories': 'Accessories',
  'accessory': 'Accessories',
}

/** Name-based overrides win over the stored category. */
function byName(name: string): string | null {
  const n = name.toLowerCase()
  if (n.includes('ryzen')) return 'CPU'
  if (n.includes('thermal paste') || n.includes('thermal grease') || n.includes('thermal compound')) return 'Other'
  return null
}

/** Normalize any Loyverse/legacy category into our PC-part categories. */
export function normalizeCategory(name: string, category: string): string {
  const hit = byName(name)
  if (hit) return hit
  const key = (category || '').trim().toLowerCase()
  if (!key) return 'Other'
  if (ALIAS[key]) return ALIAS[key]
  const exact = CATS.find((c) => c.toLowerCase() === key)
  return exact || category
}
