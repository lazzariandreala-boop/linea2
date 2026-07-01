import { defineVitestConfig } from '@nuxt/test-utils/config'

// Unit + mock-shape specs run in plain `node` (fast, no Nuxt runtime).
// Component specs opt into the Nuxt environment with a `// @vitest-environment
// nuxt` comment at the top of the file.
export default defineVitestConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/component/**/*.test.ts'],
    globals: true,
  },
})
