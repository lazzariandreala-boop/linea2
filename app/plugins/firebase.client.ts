import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics, isSupported } from 'firebase/analytics'
import type { AuthUser } from '~/composables/useAuth'

/**
 * Client-only Firebase bootstrap. Initialises the app once, exposes
 * { app, auth, db } via `$firebase` (see useFirebase), and mirrors the auth
 * session into shared reactive state so any component can read who's logged in.
 * Firestore reads/writes are gated by the security rules in firestore.rules.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const app = getApps().length ? getApp() : initializeApp(config.public.firebase)
  const auth = getAuth(app)
  const db = getFirestore(app)

  // Analytics is optional and browser-gated (avoids errors in unsupported
  // contexts like in-app webviews without measurement support).
  isSupported()
    .then((ok) => ok && getAnalytics(app))
    .catch(() => {})

  // App-wide auth session — populated on the client, read via useAuth().
  const user = useState<AuthUser | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)
  onAuthStateChanged(auth, (u) => {
    user.value = u
      ? { uid: u.uid, email: u.email, displayName: u.displayName, photoURL: u.photoURL }
      : null
    ready.value = true
  })

  return { provide: { firebase: { app, auth, db } } }
})
