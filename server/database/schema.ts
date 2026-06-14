import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core'

/* ============================================================
   Better Auth tables (camelCase props → snake_case columns)
   ============================================================ */
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  // app-specific: 'buyer' (default) | 'seller'
  role: text('role').notNull().default('buyer'),
  phone: text('phone'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

/* ============================================================
   App tables
   ============================================================ */

export interface ProductSize {
  ml: number
  price: number
  note?: string
}

export const product = sqliteTable('product', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  collectionId: text('collection_id').notNull(), // mandalika | hmns | velixir
  concentration: text('concentration'), // 'EDP' | 'Intens' | null
  image: text('image').notNull(),
  description: text('description'),
  sizes: text('sizes', { mode: 'json' }).$type<ProductSize[]>().notNull(),
  stock: integer('stock').notNull().default(0),
  isNew: integer('is_new', { mode: 'boolean' }).notNull().default(false),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const address = sqliteTable('address', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  label: text('label').notNull(), // "Rumah", "Kantor", …
  recipient: text('recipient').notNull(),
  phone: text('phone').notNull(),
  line: text('line').notNull(), // alamat lengkap (jalan, no, RT/RW, kecamatan)
  city: text('city').notNull(),
  province: text('province'),
  postalCode: text('postal_code'),
  notes: text('notes'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

// pending → processing → shipped → delivered (or cancelled)
export const order = sqliteTable('order', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => user.id),
  status: text('status').notNull().default('pending'),
  paymentMethod: text('payment_method').notNull().default('transfer'),
  subtotal: integer('subtotal').notNull(),
  shippingFee: integer('shipping_fee').notNull().default(0),
  total: integer('total').notNull(),
  // shipping address snapshot (immutable copy at checkout time)
  shipLabel: text('ship_label'),
  shipName: text('ship_name').notNull(),
  shipPhone: text('ship_phone').notNull(),
  shipAddress: text('ship_address').notNull(),
  shipCity: text('ship_city').notNull(),
  shipPostal: text('ship_postal'),
  notes: text('notes'),
  // seller notification flag
  seenBySeller: integer('seen_by_seller', { mode: 'boolean' }).notNull().default(false),
  // fulfillment checklist timestamps
  processingAt: integer('processing_at', { mode: 'timestamp' }),
  shippedAt: integer('shipped_at', { mode: 'timestamp' }),
  deliveredAt: integer('delivered_at', { mode: 'timestamp' }),
  cancelledAt: integer('cancelled_at', { mode: 'timestamp' }),
  courier: text('courier'),
  trackingNumber: text('tracking_number'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export const orderItem = sqliteTable('order_item', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => order.id, { onDelete: 'cascade' }),
  scentId: integer('scent_id').notNull(),
  scentName: text('scent_name').notNull(),
  collection: text('collection').notNull(),
  ml: integer('ml').notNull(),
  unitPrice: integer('unit_price').notNull(),
  qty: integer('qty').notNull(),
  lineTotal: integer('line_total').notNull(),
  image: text('image'),
})

// Per-user cart & wishlist (DB-backed; no localStorage)
export const cartItem = sqliteTable(
  'cart_item',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    scentId: integer('scent_id').notNull(),
    ml: integer('ml').notNull(),
    qty: integer('qty').notNull().default(1),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('cart_user_scent_ml').on(t.userId, t.scentId, t.ml)],
)

export const favorite = sqliteTable(
  'favorite',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    scentId: integer('scent_id').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [uniqueIndex('fav_user_scent').on(t.userId, t.scentId)],
)

export type User = typeof user.$inferSelect
export type Product = typeof product.$inferSelect
export type Address = typeof address.$inferSelect
export type Order = typeof order.$inferSelect
export type OrderItem = typeof orderItem.$inferSelect
