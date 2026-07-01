import type { FirebaseApp } from 'firebase/app'
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

export interface FirebaseServices {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

/**
 * Access the initialised Firebase services provided by the client plugin.
 * CLIENT-ONLY: `$firebase` is undefined during SSR, so only call this inside
 * client-guarded code (event handlers, onMounted, import.meta.client blocks).
 */
export function useFirebase(): FirebaseServices {
  const { $firebase } = useNuxtApp()
  if (!$firebase) {
    throw new Error('[useFirebase] called before the client plugin initialised (SSR?)')
  }
  return $firebase as FirebaseServices
}
