// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ProductCard from '~/components/ProductCard.vue'
import { PRODUCTS } from '~/mocks/products.mock'

describe('ProductCard', () => {
  it('renders the title, price and a link to the detail page', async () => {
    const product = PRODUCTS[0]
    const wrapper = await mountSuspended(ProductCard, { props: { product } })

    expect(wrapper.text()).toContain(product.title)
    expect(wrapper.text()).toContain('39') // formatted EUR price
    expect(wrapper.get('a').attributes('href')).toBe(`/products/${product.slug}`)
    expect(wrapper.find('img').exists()).toBe(true)
  })
})
