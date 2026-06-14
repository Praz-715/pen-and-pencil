/** Format a number as Indonesian Rupiah, e.g. 48900 -> "Rp 48.900". */
export function formatRupiah(value: number): string {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID')
}

/** "13 Jun 2026, 14.30" */
export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "13 Jun 2026" */
export function formatDate(value: string | number | Date): string {
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Slugify a string for URLs: "No. 1 EDP" -> "no-1-edp". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
