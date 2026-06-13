let authExpiredHandler: ((reasonCode?: string) => void) | null = null

export const setAuthExpiredHandler = (handler: ((reasonCode?: string) => void) | null): void => {
  authExpiredHandler = typeof handler === 'function' ? handler : null
}

export const triggerAuthExpired = (reasonCode?: string): void => {
  authExpiredHandler?.(reasonCode)
}
