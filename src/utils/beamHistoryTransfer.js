const TRANSFER_KEY = 'beam-quotation-history-transfer'

export const saveBeamQuotationTransfer = (payload) => {
  sessionStorage.setItem(TRANSFER_KEY, JSON.stringify(payload))
}

export const consumeBeamQuotationTransfer = () => {
  const raw = sessionStorage.getItem(TRANSFER_KEY)
  if (!raw) return null

  sessionStorage.removeItem(TRANSFER_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const clearBeamQuotationTransfer = () => {
  sessionStorage.removeItem(TRANSFER_KEY)
}
