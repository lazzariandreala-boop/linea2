<script setup lang="ts">
const { t } = useT()
const { isOpen, close } = useAuthModal()
const { login, register, loginWithGoogle } = useAuth()

type Mode = 'signin' | 'signup'
const mode = ref<Mode>('signin')
const email = ref('')
const password = ref('')
const displayName = ref('')
const loading = ref(false)
const error = ref('')

const title = computed(() =>
  mode.value === 'signin' ? t((m) => m.auth.signInTitle) : t((m) => m.auth.signUpTitle),
)

function reset() {
  email.value = ''
  password.value = ''
  displayName.value = ''
  error.value = ''
  loading.value = false
}

function onClose() {
  reset()
  close()
}

function switchMode() {
  mode.value = mode.value === 'signin' ? 'signup' : 'signin'
  error.value = ''
}

/** Map Firebase auth error codes to a friendly, localised message. */
function messageFor(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found'))
    return t((m) => m.auth.errorGeneric)
  if (code.includes('email-already-in-use')) return t((m) => m.auth.errorGeneric)
  return t((m) => m.auth.errorGeneric)
}

async function onSubmit() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    if (mode.value === 'signin') {
      await login(email.value, password.value)
    } else {
      await register(email.value, password.value, displayName.value.trim() || undefined)
    }
    onClose()
  } catch (e) {
    error.value = messageFor(e)
  } finally {
    loading.value = false
  }
}

async function onGoogle() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    await loginWithGoogle()
    onClose()
  } catch (e) {
    error.value = messageFor(e)
  } finally {
    loading.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) onClose()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="onClose" />

        <!-- Panel -->
        <div
          class="glass relative w-full max-w-md rounded-t-card p-6 shadow-float sm:rounded-card sm:p-8"
        >
          <button
            type="button"
            class="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-fg/60 transition-colors hover:text-fg"
            :aria-label="t((m) => m.nav.close)"
            @click="onClose"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>

          <h2 class="font-display text-2xl font-bold text-fg">{{ title }}</h2>

          <form class="mt-6 flex flex-col gap-4" @submit.prevent="onSubmit">
            <label v-if="mode === 'signup'" class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-fg/70">{{ t((m) => m.auth.displayName) }}</span>
              <input
                v-model="displayName"
                type="text"
                autocomplete="name"
                class="rounded-pill bg-surface-2 px-4 py-3 text-fg outline-none ring-1 ring-fg/10 transition-shadow focus:ring-2 focus:ring-primary"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-fg/70">{{ t((m) => m.auth.email) }}</span>
              <input
                v-model="email"
                type="email"
                required
                autocomplete="email"
                class="rounded-pill bg-surface-2 px-4 py-3 text-fg outline-none ring-1 ring-fg/10 transition-shadow focus:ring-2 focus:ring-primary"
              />
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-sm font-medium text-fg/70">{{ t((m) => m.auth.password) }}</span>
              <input
                v-model="password"
                type="password"
                required
                minlength="6"
                :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
                class="rounded-pill bg-surface-2 px-4 py-3 text-fg outline-none ring-1 ring-fg/10 transition-shadow focus:ring-2 focus:ring-primary"
              />
            </label>

            <p v-if="error" class="text-sm font-medium text-accent-2" role="alert">{{ error }}</p>

            <UiBaseButton type="submit" block :aria-busy="loading">
              {{ loading ? t((m) => m.auth.working) : mode === 'signin' ? t((m) => m.auth.signIn) : t((m) => m.auth.signUp) }}
            </UiBaseButton>
          </form>

          <div class="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-fg/40">
            <span class="h-px flex-1 bg-fg/10" />
            {{ t((m) => m.auth.or) }}
            <span class="h-px flex-1 bg-fg/10" />
          </div>

          <UiBaseButton variant="outline" block :aria-busy="loading" @click="onGoogle">
            <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.6C17 3.1 14.7 2 12 2 6.9 2 2.8 6.1 2.8 11.2S6.9 20.4 12 20.4c5.7 0 9.5-4 9.5-9.6 0-.6-.06-1.1-.16-1.6H12z" />
            </svg>
            {{ t((m) => m.auth.continueWithGoogle) }}
          </UiBaseButton>

          <button
            type="button"
            class="mt-5 w-full text-center text-sm text-fg/60 transition-colors hover:text-fg"
            @click="switchMode"
          >
            {{ mode === 'signin' ? t((m) => m.auth.noAccount) : t((m) => m.auth.haveAccount) }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s var(--ease-out-soft);
}
.modal-enter-active .glass,
.modal-leave-active .glass {
  transition: transform 0.25s var(--ease-out-soft);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .glass,
.modal-leave-to .glass {
  transform: translateY(16px);
}
@media (prefers-reduced-motion: reduce) {
  .modal-enter-from .glass,
  .modal-leave-to .glass {
    transform: none;
  }
}
</style>
