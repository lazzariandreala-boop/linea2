/**
 * Shop domain types — the client-side commerce layer (cart, profile, orders)
 * that lives in Firebase, separate from the Strapi-shaped catalog in
 * `content.ts`. Everything here is persisted to Firestore under the signed-in
 * user; guests keep a cart in localStorage until they log in.
 */
import type { Product } from './content'

/** A single line in the cart. Denormalised from Product so the cart renders
 *  and totals up without re-fetching the catalog. */
export interface CartItem {
  /** Strapi documentId — stable identity across sessions. */
  id: string
  slug: string
  title: string
  /** Unit price in EUR. Null-priced products cannot be added to the cart. */
  price: number
  image: string | null
  imageAlt: string | null
  quantity: number
}

/** Shipping destination. Also editable straight from the cart. */
export interface ShippingAddress {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  province: string
  postalCode: string
  country: string
  notes: string
}

/** The `users/{uid}` document. */
export interface UserProfile {
  displayName: string
  email: string
  phone: string
  shipping: ShippingAddress
  updatedAt?: unknown
}

export type OrderStatus = 'paid' | 'pending' | 'cancelled'

/** A `users/{uid}/orders/{orderId}` document, written after PayPal capture. */
export interface Order {
  items: CartItem[]
  amount: number
  currency: string
  status: OrderStatus
  shipping: ShippingAddress
  paypal: { orderId: string; captureId: string | null }
  createdAt?: unknown
}

/** Empty shipping address — the shape both forms bind to. */
export function emptyShippingAddress(): ShippingAddress {
  return {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Italia',
    notes: '',
  }
}

/** Empty profile — used before the Firestore doc loads / for new users. */
export function emptyProfile(): UserProfile {
  return { displayName: '', email: '', phone: '', shipping: emptyShippingAddress() }
}

/** Build a CartItem from a catalog Product. Returns null when the product has
 *  no price (display-only items can't be purchased). */
export function toCartItem(product: Product, quantity = 1): CartItem | null {
  if (product.price === null || product.price === undefined) return null
  const cover = product.gallery[0] ?? null
  return {
    id: product.documentId,
    slug: product.slug,
    title: product.title,
    price: product.price,
    image: cover?.url ?? null,
    imageAlt: cover?.alternativeText ?? product.title,
    quantity,
  }
}
