/** Shared UI overlay state (search modal, mobile menu drawer). */
export function useUi() {
  const searchOpen = useState('ui:search', () => false)
  const menuOpen = useState('ui:menu', () => false)

  function closeAll() {
    searchOpen.value = false
    menuOpen.value = false
  }

  return { searchOpen, menuOpen, closeAll }
}
