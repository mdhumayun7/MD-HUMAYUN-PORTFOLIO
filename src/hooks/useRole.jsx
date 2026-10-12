import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_ROLE, getRole } from '../data/roles'
import { track } from '../lib/analytics'

const RoleContext = createContext({ role: DEFAULT_ROLE, setRole: () => {} })

function readInitialRole() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('role')
    if (fromUrl && getRole(fromUrl)) return fromUrl
    const stored = window.localStorage.getItem('role')
    if (stored && getRole(stored)) return stored
  } catch {
    /* storage or URL access can throw in private windows */
  }
  return DEFAULT_ROLE
}

/**
 * Holds the recruiter's chosen role lens. The role comes from, in order: a
 * ?role= link (so a role-specific URL can be sent to a recruiter), the last
 * choice remembered in this browser, then "all".
 */
export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(readInitialRole)

  const setRole = useCallback((next) => {
    setRoleState(next)
    track(`role-${next}`)
    try {
      if (next === DEFAULT_ROLE) window.localStorage.removeItem('role')
      else window.localStorage.setItem('role', next)
      const url = new URL(window.location.href)
      if (next === DEFAULT_ROLE) url.searchParams.delete('role')
      else url.searchParams.set('role', next)
      window.history.replaceState(null, '', url)
    } catch {
      /* the lens still works without persistence */
    }
  }, [])

  // Keep the document title honest for the person who shares the link.
  useEffect(() => {
    const r = getRole(role)
    document.documentElement.dataset.role = r ? r.id : 'all'
  }, [role])

  const value = useMemo(() => ({ role, setRole }), [role, setRole])
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole() {
  return useContext(RoleContext)
}
