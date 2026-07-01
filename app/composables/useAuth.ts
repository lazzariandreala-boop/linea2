import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
} from 'firebase/auth'

/** Minimal serialisable view of the Firebase user kept in reactive state. */
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

/**
 * Authentication surface: email/password (with registration) and Google.
 * The reactive `user`/`ready` state is populated by the firebase.client plugin
 * via onAuthStateChanged, so it stays correct across reloads and tabs.
 */
export function useAuth() {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)
  const isLoggedIn = computed(() => user.value !== null)

  async function register(email: string, password: string, displayName?: string) {
    const { auth } = useFirebase()
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
      // Reflect the name immediately (onAuthStateChanged won't refire for this).
      if (user.value) user.value = { ...user.value, displayName }
    }
    return cred.user
  }

  async function login(email: string, password: string) {
    const { auth } = useFirebase()
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function loginWithGoogle() {
    const { auth } = useFirebase()
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    return cred.user
  }

  async function logout() {
    const { auth } = useFirebase()
    await signOut(auth)
  }

  return { user, ready, isLoggedIn, register, login, loginWithGoogle, logout }
}
