// Variant policy: CPUs, GPUs and boards have no variants — hide the field.
// RAM, storage and friends get it auto-derived from the name.

export const NO_VARIANT_CATS = ['CPU', 'GPU', 'Motherboard']

export const needsVariant = (category?: string) => !NO_VARIANT_CATS.includes((category || '').trim())

/** Derive "16GB / 3200MHz" style variants from product names. */
export function autoVariant(name: string): string {
  const parts: string[] = []
  const caps = name.match(/\d+\s?(TB|GB)/gi)?.map((s) => s.replace(/\s+/g, '').toUpperCase())
  if (caps) parts.push(...caps)
  const speeds = name.match(/\d+\s?MHz/gi)?.map((s) => s.replace(/\s+/g, ''))
  if (speeds) parts.push(...speeds)
  const inch = name.match(/(\d+(?:\.\d+)?)\s*"/)
  if (inch) parts.push(inch[1] + '"')
  const color = name.match(/\b(White|Black)\b/i)?.[0]
  if (color) parts.push(color[0].toUpperCase() + color.slice(1).toLowerCase())
  return [...new Set(parts)].join(' / ')
}
