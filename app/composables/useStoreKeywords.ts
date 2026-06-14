/** A big keyword string built from the live catalog:
 *  base perfume terms + every collection (and its concentrations) as tags. */
export function useStoreKeywords() {
  const { products, collectionsInUse } = useProducts()
  return computed(() => {
    const lists: string[][] = [BASE_KEYWORDS]
    for (const c of collectionsInUse.value) {
      const concentrations = [
        ...new Set(
          products.value
            .filter((p) => p.collectionId === c.id)
            .map((p) => p.concentration)
            .filter(Boolean) as string[],
        ),
      ]
      lists.push(collectionKeywords(c.shortName, concentrations))
    }
    return dedupeKeywords(...lists)
  })
}
