import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import type { AuthUser } from './useAuth'
import { emptyProfile, type ShippingAddress, type UserProfile } from '~/types/shop'

/** Install the auto-load watcher only once on the client. */
let profileWatcherInstalled = false

/**
 * The signed-in user's profile document (`users/{uid}`): display name, phone
 * and shipping address. Auto-loads when a user logs in and resets on logout.
 * The same instance backs both the account page and the cart's editable
 * shipping section.
 */
export function useUserProfile() {
  const profile = useState<UserProfile>('profile', () => emptyProfile())
  const loaded = useState<boolean>('profile:loaded', () => false)
  const user = useState<AuthUser | null>('auth:user', () => null)

  async function load() {
    if (!import.meta.client || !user.value) return
    const { db } = useFirebase()
    const snap = await getDoc(doc(db, 'users', user.value.uid))
    if (snap.exists()) {
      const data = snap.data() as Partial<UserProfile>
      profile.value = {
        ...emptyProfile(),
        ...data,
        shipping: { ...emptyProfile().shipping, ...(data.shipping ?? {}) },
      }
    } else {
      // Seed from the auth account so the form isn't blank for new users.
      profile.value = {
        ...emptyProfile(),
        email: user.value.email ?? '',
        displayName: user.value.displayName ?? '',
      }
    }
    loaded.value = true
  }

  async function save(patch?: Partial<UserProfile>) {
    if (!import.meta.client || !user.value) return
    if (patch) profile.value = { ...profile.value, ...patch }
    const { db } = useFirebase()
    await setDoc(
      doc(db, 'users', user.value.uid),
      { ...profile.value, email: user.value.email ?? profile.value.email, updatedAt: serverTimestamp() },
      { merge: true },
    )
  }

  async function saveShipping(shipping: ShippingAddress) {
    profile.value = { ...profile.value, shipping }
    await save()
  }

  // Load on login / clear on logout — once per client session.
  if (import.meta.client && !profileWatcherInstalled) {
    profileWatcherInstalled = true
    watch(
      user,
      (u) => {
        if (u) void load()
        else {
          profile.value = emptyProfile()
          loaded.value = false
        }
      },
      { immediate: true },
    )
  }

  return { profile, loaded, load, save, saveShipping }
}
