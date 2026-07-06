export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
  onResult: (result: R, item: T) => void,
): Promise<void> {
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(Math.max(1, limit), items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++]
      const result = await task(item)
      onResult(result, item)
    }
  })
  await Promise.all(workers)
}

