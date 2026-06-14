/** Brand-wide base keywords (always included). */
export const BASE_KEYWORDS = [
  'parfum decant',
  'decant parfum',
  'perfume decant',
  'parfum tester',
  'tester parfum',
  'perfume tester',
  'decant',
  'tester parfum original',
  'parfum original',
  'parfum ori',
  'parfum branded',
  'parfum murah',
  'jual parfum decant',
  'share parfum',
  'Pen & Pencil',
  'pen and pencil',
  'penandpencil',
]

/** Tags for one collection, e.g. ("Mandalika", ["EDP","Intens"]) →
 *  Mandalika, Mandalika decant, Mandalika tester, decant Mandalika, parfum Mandalika,
 *  Mandalika EDP, Mandalika EDP decant, Mandalika Intens, … */
export function collectionKeywords(name: string, concentrations: string[] = []): string[] {
  const k = [name, `${name} decant`, `${name} tester`, `decant ${name}`, `parfum ${name}`]
  for (const c of concentrations) {
    if (!c) continue
    k.push(`${name} ${c}`, `${name} ${c} decant`)
  }
  return k
}

/** Tags for a single product. */
export function productKeywords(name: string, collection: string, concentration?: string | null): string[] {
  const k = [
    name,
    `${name} decant`,
    `${name} tester`,
    `decant ${name}`,
    collection,
    `decant ${collection}`,
    `parfum ${collection}`,
  ]
  if (concentration) k.push(`${collection} ${concentration}`, `${name} ${concentration}`)
  return k
}

export function dedupeKeywords(...lists: string[][]): string {
  return [...new Set(lists.flat().map((s) => s.trim()).filter(Boolean))].join(', ')
}
