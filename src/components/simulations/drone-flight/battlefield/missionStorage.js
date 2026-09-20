// ===========================================================================
//  MISSION SAVE DATA
//
//  A small, defensive wrapper around localStorage: private browsing, blocked
//  storage, or a full quota should degrade to "nothing saved this session"
//  rather than throw and take the demo down with it.
// ===========================================================================

const BEST_KEY = 'battleworld.best'
const LOG_KEY = 'battleworld.log'
const LOG_LIMIT = 5

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function loadBest() {
  return safeGet(BEST_KEY)
}

export function loadLog() {
  return safeGet(LOG_KEY) || []
}

/** Records a completed run, updates the best time if this one beat it. */
export function saveMissionResult({ time, hostilesNeutralized }) {
  const entry = { time, hostilesNeutralized, at: Date.now() }

  const log = [entry, ...loadLog()].slice(0, LOG_LIMIT)
  safeSet(LOG_KEY, log)

  const best = loadBest()
  const isNewBest = !best || time < best.time
  if (isNewBest) safeSet(BEST_KEY, entry)

  return { isNewBest, best: isNewBest ? entry : best }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = (seconds % 60).toFixed(1).padStart(4, '0')
  return `${m}:${s}`
}
