/**
 * Global open/close state for the login/registration modal, so the header
 * avatar and the cart's "sign in to checkout" prompt can trigger the same
 * dialog mounted once in the layout.
 */
export function useAuthModal() {
  const isOpen = useState<boolean>('authModal:open', () => false)
  const open = () => (isOpen.value = true)
  const close = () => (isOpen.value = false)
  return { isOpen, open, close }
}
