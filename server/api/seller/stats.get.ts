import { inArray, ne } from 'drizzle-orm'

function startOfToday(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
function startOfWeek(d: Date) {
  // Monday as first day
  const day = (d.getDay() + 6) % 7
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day)
  return s.getTime()
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export default defineEventHandler(async (event) => {
  await requireSeller(event)

  // All real sales (exclude cancelled)
  const orders = await db.select().from(schema.order).where(ne(schema.order.status, 'cancelled'))
  const ids = orders.map((o) => o.id)
  const items = ids.length
    ? await db.select().from(schema.orderItem).where(inArray(schema.orderItem.orderId, ids))
    : []

  const bottlesByOrder = new Map<string, number>()
  for (const it of items) bottlesByOrder.set(it.orderId, (bottlesByOrder.get(it.orderId) ?? 0) + it.qty)

  const now = new Date()
  const bounds = {
    today: startOfToday(now),
    week: startOfWeek(now),
    month: startOfMonth(now),
    all: 0,
  }

  function agg(since: number) {
    let revenue = 0
    let count = 0
    let bottles = 0
    for (const o of orders) {
      const t = new Date(o.createdAt).getTime()
      if (t >= since) {
        revenue += o.total
        count += 1
        bottles += bottlesByOrder.get(o.id) ?? 0
      }
    }
    return { revenue, orders: count, bottles }
  }

  const stats = {
    today: agg(bounds.today),
    week: agg(bounds.week),
    month: agg(bounds.month),
    all: agg(bounds.all),
  }

  // Pipeline (open orders by status)
  const pipeline = { pending: 0, processing: 0, shipped: 0, delivered: 0 }
  for (const o of orders) {
    if (o.status in pipeline) pipeline[o.status as keyof typeof pipeline] += 1
  }

  return { stats, pipeline }
})
