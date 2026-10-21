import { doc, getDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import type { AuthUser } from './useAuth'
import { toCartItem, type CartItem } from '~/types/shop'
import type { Product } from '~/types/content'

const STORAGE_KEY = 'linea2-cart'

/** Client-session singletons: install listeners once, track the live sub. */
let cartInitialised = false
let unsubscribeCart: (() => void) | null = null
/** Suppress the local-persist watcher while we apply a remote snapshot. */
let applyingRemote = false

/** Union two carts by product id, keeping the larger quantity (so logging in
 *  never silently doubles an item that already existed remotely). */
function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>()
  for (const item of a) byId.set(item.id, { ...item })
  for (const item of b) {
    const existing = byId.get(item.id)
    if (existing) existing.quantity = Math.max(existing.quantity, item.quantity)
    else byId.set(item.id, { ...item })
  }
  return [...byId.values()]
}

/**
 * Shopping cart. Lives in localStorage for guests; on login it merges into
 * `carts/{uid}` in Firestore and subscribes for cross-device sync. Quantities
 * and contents are always persisted, per the requirement.
 */
export function useCart() {
  const items = useState<CartItem[]>('cart:items', () => [])
  const user = useState<AuthUser | null>('auth:user', () => null)

  const count = computed(() => items.value.reduce((n, i) => n + i.quantity, 0))
  const subtotal = computed(() => items.value.reduce((s, i) => s + i.price * i.quantity, 0))
  const isEmpty = computed(() => items.value.length === 0)

  function persistLocal() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      /* storage unavailable — in-memory cart still works */
    }
  }

  async function persistRemote() {
    if (!import.meta.client || !user.value) return
    const { db } = useFirebase()
    await setDoc(doc(db, 'carts', user.value.uid), {
      items: items.value,
      updatedAt: serverTimestamp(),
    })
  }

  function persist() {
    persistLocal()
    void persistRemote()
  }

  /** Add a catalog product. Returns false if it has no price (not purchasable). */
  function add(product: Product, quantity = 1): boolean {
    const line = toCartItem(product, quantity)
    if (!line) return false
    const existing = items.value.find((i) => i.id === line.id)
    if (existing) existing.quantity += quantity
    else items.value.push(line)
    persist()
    return true
  }

  /** Add a ready-made line (e.g. a configured Stella bag). Lines with the same
   *  id (same configuration) merge their quantities. */
  function addLine(line: CartItem) {
    const existing = items.value.find((i) => i.id === line.id)
    if (existing) existing.quantity += line.quantity
    else items.value.push({ ...line })
    persist()
  }

  function setQuantity(id: string, quantity: number) {
    const q = Math.max(1, Math.floor(quantity))
    const item = items.value.find((i) => i.id === id)
    if (item) item.quantity = q
    persist()
  }

  function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  async function clear() {
    items.value = []
    persistLocal()
    if (import.meta.client && user.value) {
      const { db } = useFirebase()
      await deleteDoc(doc(db, 'carts', user.value.uid)).catch(() => {})
    }
  }

  if (import.meta.client && !cartInitialised) {
    cartInitialised = true

    // Hydrate guest cart from localStorage AFTER mount, so first client render
    // matches SSR (empty) and there's no hydration mismatch on the count badge.
    onMounted(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw && items.value.length === 0) items.value = JSON.parse(raw) as CartItem[]
      } catch {
        /* ignore corrupt storage */
      }
    })

    // React to login/logout.
    watch(
      user,
      async (u) => {
        unsubscribeCart?.()
        unsubscribeCart = null
        if (!u) return // logged out: keep local cart as-is

        const { db } = useFirebase()
        const ref = doc(db, 'carts', u.uid)
        const snap = await getDoc(ref)
        const remote = snap.exists() ? ((snap.data().items as CartItem[]) ?? []) : []
        const merged = mergeCarts(remote, items.value)

        applyingRemote = true
        items.value = merged
        applyingRemote = false
        await setDoc(ref, { items: merged, updatedAt: serverTimestamp() })

        // Live sync across devices/tabs.
        unsubscribeCart = onSnapshot(ref, (s) => {
          if (!s.exists()) return
          applyingRemote = true
          items.value = (s.data().items as CartItem[]) ?? []
          applyingRemote = false
        })
      },
      { immediate: true },
    )

    // Keep localStorage current for guests (logged-in writes go through persist()).
    watch(
      items,
      () => {
        if (!applyingRemote && !user.value) persistLocal()
      },
      { deep: true },
    )
  }

  return { items, count, subtotal, isEmpty, add, addLine, setQuantity, remove, clear }
}
