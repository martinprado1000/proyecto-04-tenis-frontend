import { createContext, useContext, useEffect, useState } from 'react'
import { getSystemBranding } from '../api/organizations.api'

const DEFAULT_BRANDING = { name: 'MatchPoint TC', logoUrl: '' }
const BrandingContext = createContext(DEFAULT_BRANDING)

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULT_BRANDING)

  useEffect(() => {
    getSystemBranding().then((data) => setBranding({ ...DEFAULT_BRANDING, ...data })).catch(() => {})
  }, [])

  return <BrandingContext.Provider value={{ branding, setBranding }}>{children}</BrandingContext.Provider>
}

export function useBranding() {
  return useContext(BrandingContext)
}
