const isFlagEnabled = (value: unknown, fallback: boolean = false): boolean => {
  if (value === undefined || value === null || value === '') return fallback
  return String(value).trim().toLowerCase() === 'true'
}

export const isPublicRegisterEnabled: boolean = isFlagEnabled(import.meta.env.VITE_ALLOW_PUBLIC_REGISTER, false)