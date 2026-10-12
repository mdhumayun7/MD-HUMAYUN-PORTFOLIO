import { site } from '../config/site'

// ===========================================================================
//  PRIVACY-FRIENDLY ANALYTICS (optional)
//  Uses GoatCounter: no cookies, no personal data, no consent banner needed.
//  It stays completely off until site.analytics.goatcounter is set to your
//  GoatCounter site code (free account at goatcounter.com).
// ===========================================================================

let loaded = false

export function initAnalytics() {
  const code = site.analytics && site.analytics.goatcounter
  if (!code || loaded || typeof document === 'undefined') return
  loaded = true
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.setAttribute('data-goatcounter', `https://${code}.goatcounter.com/count`)
  document.head.appendChild(s)
}

/** Record a named interaction, for example track('resume-download'). */
export function track(name) {
  try {
    const gc = typeof window !== 'undefined' && window.goatcounter
    if (gc && typeof gc.count === 'function') {
      gc.count({ path: `event/${name}`, title: name, event: true })
    }
  } catch {
    /* analytics must never break the page */
  }
}
