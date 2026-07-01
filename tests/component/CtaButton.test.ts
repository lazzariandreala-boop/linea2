// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import CtaButton from '~/components/CtaButton.vue'
import type { CtaComponent } from '~/types/content'

describe('CtaButton', () => {
  it('renders a WhatsApp CTA as a wa.me link opening in a new tab', async () => {
    const cta: CtaComponent = { id: 1, kind: 'whatsapp', value: '+39 333 123 4567', label: 'Ordina' }
    const wrapper = await mountSuspended(CtaButton, { props: { cta } })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('https://wa.me/393331234567')
    expect(link.attributes('target')).toBe('_blank')
    expect(wrapper.text()).toContain('Ordina')
  })

  it('renders an email CTA as a mailto link in the same tab', async () => {
    const cta: CtaComponent = { id: 2, kind: 'email', value: 'ordini@linea2.example', label: 'Scrivici' }
    const wrapper = await mountSuspended(CtaButton, { props: { cta } })

    const link = wrapper.get('a')
    expect(link.attributes('href')).toBe('mailto:ordini@linea2.example')
    expect(link.attributes('target')).toBeUndefined()
  })
})
