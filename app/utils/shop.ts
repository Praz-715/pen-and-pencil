/** Store-wide constants for Pen & Pencil. Edit here to update everywhere. */
export const SHOP = {
  name: 'Pen & Pencil',
  handle: 'penandpencil.id',
  tagline: 'Decant & Tester Parfum Original',
  established: 2018,
  yearsActive: 8, // 2018 → 2026
  rating: 4.9,
  reviewsLabel: '2.7RB',
  reviewsCount: 2700,
  chatResponse: 92, // % chat dibalas (hitungan jam)
  hours: 'Senin – Sabtu · 08.00 – 15.00 WIB',
  hoursShort: 'Sen–Sab, 08.00–15.00',
  shipFrom: 'Jakarta Barat',
  gender: 'Unisex',
  shopeeUrl: 'https://shopee.co.id/penandpencil.id',
  // TODO: ganti dengan nomor WhatsApp resmi toko (format 62…, tanpa "+", "0", atau spasi)
  whatsapp: '6281234567890',
  instagram: 'https://instagram.com/penandpencil.id',
} as const

/** Build a wa.me deep link with a prefilled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(message)}`
}
