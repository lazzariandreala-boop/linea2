<script setup lang="ts">
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

/**
 * Newsletter sign-up. The address is written to Firestore (collection
 * "newsletter"); success is only shown once the write has gone through.
 */
const id = useId()
const email = ref('')
const state = ref<'idle' | 'sending' | 'done' | 'error'>('idle')
const invalid = ref(false)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function subscribe() {
  const value = email.value.trim()
  invalid.value = !EMAIL_RE.test(value)
  if (invalid.value) return
  state.value = 'sending'
  try {
    const { db } = useFirebase()
    await addDoc(collection(db, 'newsletter'), { email: value, createdAt: serverTimestamp() })
    state.value = 'done'
    email.value = ''
  } catch (err) {
    console.warn('[newsletter]', err)
    state.value = 'error'
  }
}
watch(email, () => {
  if (invalid.value && EMAIL_RE.test(email.value.trim())) invalid.value = false
})
</script>

<template>
  <section class="border-t border-line bg-surface" :aria-labelledby="`${id}-title`">
    <div class="site-container grid gap-8 py-14 sm:py-20 lg:grid-cols-[1fr_1.1fr] lg:items-end lg:gap-20">
      <div>
        <p class="kicker">Newsletter</p>
        <h2 :id="`${id}-title`" class="mt-4 text-title">Lettere dal laboratorio</h2>
        <p class="mt-4 max-w-md text-muted">
          Nuovi pezzi, storie dal banco di lavoro e consigli per far durare il tuo denim. Poche email, quando c’è
          qualcosa da raccontare.
        </p>
      </div>

      <form novalidate @submit.prevent="subscribe">
        <div v-if="state === 'done'" class="border-t border-ink py-5" role="status">
          <p class="font-display text-xl text-ink">Grazie per l’iscrizione.</p>
          <p class="mt-1 text-sm text-muted">Ti scriveremo quando ci sarà qualcosa di nuovo dal laboratorio.</p>
        </div>
        <template v-else>
          <label :for="`${id}-email`" class="meta">Il tuo indirizzo email</label>
          <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              :id="`${id}-email`"
              v-model="email"
              type="email"
              autocomplete="email"
              inputmode="email"
              placeholder="nome@esempio.it"
              class="field min-h-[52px] flex-1"
              :aria-invalid="invalid"
              :aria-describedby="invalid || state === 'error' ? `${id}-msg` : undefined"
              :disabled="state === 'sending'"
            />
            <UiBaseButton type="submit" size="lg" :disabled="state === 'sending'" :aria-busy="state === 'sending'">
              <span v-if="state === 'sending'" class="spinner" aria-hidden="true" />
              {{ state === 'sending' ? 'Invio…' : 'Iscriviti' }}
            </UiBaseButton>
          </div>
          <p v-if="invalid" :id="`${id}-msg`" class="form-error mt-2 text-sm" role="alert">
            Inserisci un indirizzo email valido.
          </p>
          <p v-else-if="state === 'error'" :id="`${id}-msg`" class="form-error mt-2 text-sm" role="alert">
            Non siamo riusciti a iscriverti. Riprova tra poco o scrivici su Instagram.
          </p>
          <p v-else class="mt-3 text-xs text-muted">Puoi cancellarti in qualsiasi momento.</p>
        </template>
      </form>
    </div>
  </section>
</template>

<style scoped>
.spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
  border-right-color: transparent;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
