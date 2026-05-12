import type { AsyncResult } from '@/types'

const to = <T>(promise: Promise<T>): Promise<AsyncResult<T>> =>
  promise.then((data) => [null, data] as AsyncResult<T>).catch((err: Error) => [err, null] as AsyncResult<T>)

export { to }