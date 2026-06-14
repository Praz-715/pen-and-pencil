export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItemDTO {
  id: string
  scentId: number
  scentName: string
  collection: string
  ml: number
  unitPrice: number
  qty: number
  lineTotal: number
  image?: string | null
}

export interface OrderDTO {
  id: string
  code: string
  buyerId: string
  status: OrderStatus
  paymentMethod: string
  subtotal: number
  shippingFee: number
  total: number
  shipLabel?: string | null
  shipName: string
  shipPhone: string
  shipAddress: string
  shipCity: string
  shipPostal?: string | null
  notes?: string | null
  courier?: string | null
  trackingNumber?: string | null
  seenBySeller?: boolean
  createdAt: string
  processingAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  items?: OrderItemDTO[]
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Menunggu konfirmasi',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

/** Linear fulfillment flow (cancelled is off-flow). */
export const STATUS_FLOW: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered']

export function statusStep(s: OrderStatus): number {
  return STATUS_FLOW.indexOf(s)
}

/** What the seller can do next from a given status. */
export function nextActions(s: OrderStatus): { status: OrderStatus; label: string }[] {
  switch (s) {
    case 'pending':
      return [{ status: 'processing', label: 'Konfirmasi & proses' }]
    case 'processing':
      return [{ status: 'shipped', label: 'Tandai dikirim' }]
    case 'shipped':
      return [{ status: 'delivered', label: 'Tandai selesai' }]
    default:
      return []
  }
}
