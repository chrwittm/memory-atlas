import '@testing-library/jest-dom/vitest'

let nextUrl = 0
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: () => `blob:test-${nextUrl++}`,
})
Object.defineProperty(URL, 'revokeObjectURL', {
  configurable: true,
  value: () => undefined,
})

