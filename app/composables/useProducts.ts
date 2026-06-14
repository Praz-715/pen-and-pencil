/** Storefront products, fetched once from the DB-backed API and shared (SSR-friendly). */
export function useProducts() {
  const { data, refresh, pending } = useAsyncData(
    'products',
    () => $fetch<Scent[]>('/api/products'),
    { default: () => [] as Scent[] },
  )

  const products = computed<Scent[]>(() => data.value ?? [])
  const getById = (id: number) => products.value.find((p) => p.id === id)
  const byCollection = (cid: string) => products.value.filter((p) => p.collectionId === cid)
  const siblings = (s: Pick<Scent, 'id' | 'collectionId'>) =>
    products.value.filter((p) => p.collectionId === s.collectionId && p.id !== s.id)

  /** Collections that actually have products — known ones first, then seller-added.
   *  Synthesized collections borrow their first product's image for the gallery. */
  const collectionsInUse = computed<Collection[]>(() => {
    const present = new Set(products.value.map((p) => p.collectionId))
    const known = collections.filter((c) => present.has(c.id))
    const extraIds = [...present].filter((id) => !collections.some((c) => c.id === id))
    const ordered = [...known, ...extraIds.map((id) => getCollection(id))]
    return ordered.map((c) => ({
      ...c,
      gallery: c.gallery.length ? c.gallery : [products.value.find((p) => p.collectionId === c.id)?.image].filter(Boolean) as string[],
    }))
  })

  return { products, getById, byCollection, siblings, collectionsInUse, pending, refresh }
}
