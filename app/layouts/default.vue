<script setup lang="ts">
const { t } = useT()
</script>

<template>
  <div class="site-canvas flex min-h-dvh flex-col">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
    >
      {{ t((m) => m.common.skipToContent) }}
    </a>

    <AppHeader />

    <main id="main" class="flex-1">
      <slot />
    </main>

    <NewsletterSignup />
    <AppFooter />

    <!-- Global login/registration modal (opened from the header avatar). -->
    <AuthModal />

    <!-- Site-wide loading overlay (page changes, embeds, 3D, sign-in). -->
    <AppLoader />
  </div>
</template>
