const unwrap = <T extends (...args: never[]) => Promise<{ data: unknown }>>(fn: T) =>
  (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>['data']> => fn(...args).then((res) => res.data)

export { unwrap }