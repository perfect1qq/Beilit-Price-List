export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void
  cancel: () => void
}

export const debounce = <T extends (...args: unknown[]) => void>(fn: T, delay: number = 300): DebouncedFunction<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null
  const debounced = (...args: Parameters<T>) => {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
  debounced.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
  }
  return debounced
}
