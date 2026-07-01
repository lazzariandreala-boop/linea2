<script setup lang="ts">
import type { ShippingAddress } from '~/types/shop'

// The address object is owned by the parent (profile.shipping); we mutate its
// fields in place, which keeps the parent's reactive state in sync without an
// emit round-trip. Vue only warns on reassigning a prop, not nested fields.
defineProps<{ address: ShippingAddress }>()

const { t } = useT()

const inputClass =
  'w-full rounded-xl bg-surface-2 px-4 py-3 text-fg outline-none ring-1 ring-fg/10 transition-shadow focus:ring-2 focus:ring-primary'
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <label class="flex flex-col gap-1.5 sm:col-span-2">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.fullName) }}</span>
      <input v-model="address.fullName" type="text" autocomplete="name" :class="inputClass" />
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.phone) }}</span>
      <input v-model="address.phone" type="tel" autocomplete="tel" :class="inputClass" />
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.country) }}</span>
      <input v-model="address.country" type="text" autocomplete="country-name" :class="inputClass" />
    </label>

    <label class="flex flex-col gap-1.5 sm:col-span-2">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.line1) }}</span>
      <input v-model="address.line1" type="text" autocomplete="address-line1" :class="inputClass" />
    </label>

    <label class="flex flex-col gap-1.5 sm:col-span-2">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.line2) }}</span>
      <input v-model="address.line2" type="text" autocomplete="address-line2" :class="inputClass" />
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.city) }}</span>
      <input v-model="address.city" type="text" autocomplete="address-level2" :class="inputClass" />
    </label>

    <div class="grid grid-cols-2 gap-4">
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.province) }}</span>
        <input v-model="address.province" type="text" autocomplete="address-level1" :class="inputClass" />
      </label>
      <label class="flex flex-col gap-1.5">
        <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.postalCode) }}</span>
        <input v-model="address.postalCode" type="text" autocomplete="postal-code" :class="inputClass" />
      </label>
    </div>

    <label class="flex flex-col gap-1.5 sm:col-span-2">
      <span class="text-sm font-medium text-fg/70">{{ t((m) => m.shipping.notes) }}</span>
      <textarea v-model="address.notes" rows="2" :class="inputClass" />
    </label>
  </div>
</template>
