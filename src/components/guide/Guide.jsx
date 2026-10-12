import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { projects } from '../../data/projects'
import { getRole } from '../../data/roles'
import { FAQ, GREETING, SECTION_TIPS, projectTip, tourSteps } from '../../data/guide'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useRole } from '../../hooks/useRole'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/cn'
import { GuideAvatar } from './GuideAvatar'

// ===========================================================================
//  SITE GUIDE
//  A small scripted guide. On a desktop with a mouse it trails the cursor and
//  says a line about whatever section is on screen; everywhere it can open a
//  60-second tour and answer common recruiter questions. It is switched off
//  for visitors who prefer reduced motion (they still get the tour and the
//  answers) and can be turned off by anyone from its panel.
// ===========================================================================

const PREF_KEY = 'guide'
const GREETED_KEY = 'guide-greeted'
const SEEN_KEY = 'guide-seen'
const TIP_MS = 7000
const MIN_GAP_MS = 6000

const SECTION_IDS = ['hero', 'about', 'projects', 'notes', 'skills', 'experience', 'publications', 'achievements', 'contact']

function store(kind) {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}
const readLocal = (k) => {
  try {
    return store('local')?.getItem(k)
  } catch {
    return null
  }
}
const writeLocal = (k, v) => {
  try {
    store('local')?.setItem(k, v)
  } catch {
    /* ignore */
  }
}
function readSeen() {
  try {
    return new Set(JSON.parse(store('session')?.getItem(SEEN_KEY) || '[]'))
  } catch {
    return new Set()
  }
}
function writeSeen(set) {
  try {
    store('session')?.setItem(SEEN_KEY, JSON.stringify([...set]))
  } catch {
    /* ignore */
  }
}

function usePointerFine() {
  const [fine, setFine] = useState(false)
  useEffect(() => {
    const q = window.matchMedia('(pointer: fine) and (hover: hover)')
    setFine(q.matches)
    const on = (e) => setFine(e.matches)
    q.addEventListener('change', on)
    return () => q.removeEventListener('change', on)
  }, [])
  return fine
}

export function Guide() {
  const reduced = useReducedMotion()
  const fine = usePointerFine()
  const { role } = useRole()

  const [enabled, setEnabled] = useState(() => readLocal(PREF_KEY) !== 'off')
  const [open, setOpen] = useState(false)
  const [view, setView] = useState({ mode: 'menu' }) // menu | tour | answer
  const [tip, setTip] = useState(null)
  const [flip, setFlip] = useState(false)

  const followRef = useRef(null)
  const panelRef = useRef(null)
  const dockRef = useRef(null)
  const mouse = useRef({ x: -100, y: -100, seen: false })
  const pos = useRef({ x: -100, y: -100 })
  const lastTipAt = useRef(0)
  const tipTimer = useRef(null)
  const current = useRef({ section: null, project: null })
  const tourRef = useRef(null)

  const following = enabled && fine && !reduced && !open

  // ---- tips -------------------------------------------------------------
  const showTip = useCallback(
    (id, text, { force = false } = {}) => {
      if (!enabled) return
      const now = Date.now()
      const seen = readSeen()
      if (!force) {
        if (seen.has(id)) return
        if (now - lastTipAt.current < MIN_GAP_MS) return
      }
      seen.add(id)
      writeSeen(seen)
      lastTipAt.current = now
      setTip({ id, text })
      clearTimeout(tipTimer.current)
      tipTimer.current = setTimeout(() => setTip(null), TIP_MS)
    },
    [enabled],
  )

  // ---- greeting ---------------------------------------------------------
  useEffect(() => {
    if (!enabled || readLocal(GREETED_KEY)) return undefined
    const t = setTimeout(() => {
      showTip('greeting', GREETING, { force: true })
      writeLocal(GREETED_KEY, '1')
    }, 2600)
    return () => clearTimeout(t)
  }, [enabled, showTip])

  // ---- which section / project is on screen ------------------------------
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const onHit = (kind, id) => {
      if (current.current[kind] === id) return
      current.current[kind] = id
      if (open) return
      if (kind === 'project') {
        const p = projects.find((x) => x.id === id)
        if (p) showTip(`project-${id}`, projectTip(p, role))
      } else if (SECTION_TIPS[id]) {
        showTip(`section-${id}`, SECTION_TIPS[id])
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          if (e.target.tagName === 'ARTICLE') onHit('project', e.target.id)
          else onHit('section', e.target.id)
        })
      },
      { rootMargin: '-42% 0px -50% 0px', threshold: 0 },
    )
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) io.observe(el)
    })
    document.querySelectorAll('#projects article[id]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [open, role, showTip])

  // ---- follow the cursor --------------------------------------------------
  useEffect(() => {
    if (!following) return undefined
    const onMove = (e) => {
      mouse.current.x = e.clientX
      mouse.current.y = e.clientY
      if (!mouse.current.seen) {
        mouse.current.seen = true
        pos.current.x = e.clientX
        pos.current.y = e.clientY
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    let raf = 0
    let lastFlip = false
    const tick = () => {
      const el = followRef.current
      if (el && mouse.current.seen) {
        const tx = mouse.current.x + 26
        const ty = mouse.current.y + 22
        const dx = tx - pos.current.x
        const dy = ty - pos.current.y
        pos.current.x += dx * 0.14
        pos.current.y += dy * 0.14
        const maxX = window.innerWidth - 44
        const maxY = window.innerHeight - 44
        const x = Math.max(4, Math.min(maxX, pos.current.x))
        const y = Math.max(4, Math.min(maxY, pos.current.y))
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`
        el.style.opacity = '1'
        const lx = Math.max(-1, Math.min(1, dx / 40))
        const ly = Math.max(-1, Math.min(1, dy / 40))
        el.style.setProperty('--lx', lx.toFixed(2))
        el.style.setProperty('--ly', ly.toFixed(2))
        const wantFlip = x > window.innerWidth - 340
        if (wantFlip !== lastFlip) {
          lastFlip = wantFlip
          setFlip(wantFlip)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [following])

  // ---- panel plumbing -----------------------------------------------------
  const openPanel = useCallback((next = { mode: 'menu' }) => {
    setView(next)
    setOpen(true)
    setTip(null)
    track('guide-open')
  }, [])
  const closePanel = useCallback(() => {
    setOpen(false)
    setView({ mode: 'menu' })
    dockRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && closePanel()
    window.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closePanel])

  // Open from anywhere (the command palette uses this).
  useEffect(() => {
    const on = () => openPanel({ mode: 'menu' })
    const tour = () => tourRef.current && tourRef.current()
    window.addEventListener('guide:open', on)
    window.addEventListener('guide:tour', tour)
    return () => {
      window.removeEventListener('guide:open', on)
      window.removeEventListener('guide:tour', tour)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPanel])

  const goTo = (selector) => {
    const el = document.querySelector(selector)
    if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }

  const steps = tourSteps(role)
  const startTour = () => {
    track('guide-tour')
    setOpen(true)
    setTip(null)
    setView({ mode: 'tour', step: 0 })
    goTo(tourSteps(role)[0].target)
  }
  tourRef.current = startTour
  const gotoStep = (i) => {
    setView({ mode: 'tour', step: i })
    goTo(steps[i].target)
  }
  const ask = (item) => {
    track(`guide-q-${item.q.slice(0, 18)}`)
    setView({ mode: 'answer', q: item.q, a: item.answer(role) })
  }
  const toggleEnabled = () => {
    const next = !enabled
    setEnabled(next)
    writeLocal(PREF_KEY, next ? 'on' : 'off')
    if (!next) setTip(null)
  }

  const activeRole = getRole(role)

  return (
    <div className="no-print">
      {/* ---- trailing guide (desktop pointer only, decorative) -------------- */}
      {following && (
        <div
          ref={followRef}
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-50 opacity-0"
          style={{ willChange: 'transform' }}
        >
          <div className="relative">
            <GuideAvatar size={34} />
            {tip && (
              <div
                className={cn(
                  'absolute top-0 w-[19rem] border border-accent bg-bg px-3 py-2 text-micro leading-snug',
                  flip ? 'right-full mr-2' : 'left-full ml-2',
                )}
              >
                {tip.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- dock: the always-available way in ----------------------------- */}
      <div className="fixed bottom-[4.9rem] left-4 z-50 flex items-end gap-2 sm:bottom-5">
        <button
          ref={dockRef}
          type="button"
          onClick={() => (open ? closePanel() : openPanel())}
          aria-expanded={open}
          aria-controls="guide-panel"
          className="flex items-center gap-2 border border-line bg-bg p-1.5 text-small shadow-sm sm:pr-3
                     transition-colors hover:border-accent hover:text-accent"
        >
          <GuideAvatar size={26} />
          <span className="hidden sm:inline">Guide</span>
          <span className="sr-only sm:hidden">Site guide</span>
        </button>

        {/* Tip bubble for people the cursor-follower does not run for. */}
        {tip && !following && !open && (
          <div
            role="status"
            className="max-w-[16rem] border border-accent bg-bg px-3 py-2 text-micro leading-snug sm:max-w-xs"
          >
            {tip.text}
          </div>
        )}
      </div>

      {/* ---- panel ---------------------------------------------------------- */}
      {open && (
        <div
          id="guide-panel"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-label="Site guide"
          className="fixed bottom-[8.4rem] left-4 z-50 w-[min(24rem,calc(100vw-2rem))] border border-line bg-bg
                     shadow-lg outline-none sm:bottom-[4.6rem]"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="flex items-center gap-2 text-small font-medium">
              <GuideAvatar size={22} />
              Site guide
            </span>
            <button
              type="button"
              onClick={closePanel}
              aria-label="Close guide"
              className="text-muted hover:text-accent"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          <div className="max-h-[min(26rem,60vh)] overflow-y-auto px-4 py-4" aria-live="polite">
            {view.mode === 'menu' && (
              <>
                <p className="text-small">
                  I can walk you through this site in about a minute, or answer the questions recruiters
                  ask most.
                  {activeRole ? ` I am following the ${activeRole.label} lens you picked.` : ''}
                </p>
                <button
                  type="button"
                  onClick={startTour}
                  className="mt-4 w-full border border-accent bg-accent px-4 py-2 text-small font-medium text-bg hover:opacity-90"
                >
                  Start the 60-second tour
                </button>
                <ul className="mt-4 divide-y divide-[var(--c-grey-200)] border-y border-line">
                  {FAQ.map((item) => (
                    <li key={item.q}>
                      <button
                        type="button"
                        onClick={() => ask(item)}
                        className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-small
                                   transition-colors hover:text-accent"
                      >
                        {item.q}
                        <ArrowRight size={14} aria-hidden className="shrink-0 text-muted" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {view.mode === 'tour' && (
              <>
                <p className="nums text-micro text-muted">
                  Step {view.step + 1} of {steps.length}
                </p>
                <h3 className="mt-1 font-display text-lead font-semibold">{steps[view.step].title}</h3>
                <p className="mt-2 text-small">{steps[view.step].text}</p>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={view.step === 0}
                    onClick={() => gotoStep(view.step - 1)}
                    className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-small
                               hover:border-accent hover:text-accent disabled:opacity-40"
                  >
                    <ArrowLeft size={14} aria-hidden />
                    Back
                  </button>
                  {view.step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => gotoStep(view.step + 1)}
                      className="inline-flex items-center gap-1.5 border border-accent bg-accent px-3 py-1.5 text-small
                                 font-medium text-bg hover:opacity-90"
                    >
                      Next
                      <ArrowRight size={14} aria-hidden />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={closePanel}
                      className="border border-accent bg-accent px-3 py-1.5 text-small font-medium text-bg hover:opacity-90"
                    >
                      Finish
                    </button>
                  )}
                </div>
              </>
            )}

            {view.mode === 'answer' && (
              <>
                <h3 className="font-display text-lead font-semibold">{view.q}</h3>
                <p className="mt-2 text-small">{view.a.text}</p>
                {view.a.links && view.a.links.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                    {view.a.links.map((l) => (
                      <li key={l.label + l.href}>
                        <a
                          href={l.href}
                          {...(l.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                          onClick={() => {
                            if (l.href.startsWith('#')) setOpen(false)
                          }}
                          className="border-b border-line pb-px text-small hover:border-accent hover:text-accent"
                        >
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setView({ mode: 'menu' })}
                  className="mt-5 inline-flex items-center gap-1.5 text-small text-muted hover:text-accent"
                >
                  <ArrowLeft size={14} aria-hidden />
                  All questions
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5 text-micro text-muted">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={enabled}
                onChange={toggleEnabled}
                className="accent-[var(--c-accent)]"
              />
              {fine && !reduced ? 'Follow my cursor and give tips' : 'Give tips as I scroll'}
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
