import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { projects } from '../../data/projects'
import { getRole, roles } from '../../data/roles'
import { profile } from '../../data/profile'
import { enabledSections } from '../../config/site'
import { useRole } from '../../hooks/useRole'
import { shortTitle } from '../../lib/projectMeta'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/cn'

// ===========================================================================
//  COMMAND PALETTE  (Ctrl+K, Cmd+K or "/")
//  Type a project, a role, a section or an action and jump straight to it.
//  Everything in the list is built from the site's own data files.
// ===========================================================================

export const OPEN_EVENT = 'palette:open'

export function CommandPalette() {
  const { role, setRole } = useRole()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const returnFocus = useRef(null)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setIndex(0)
    returnFocus.current?.focus?.()
  }, [])

  const items = useMemo(() => {
    const go = (hash) => () => {
      const el = document.querySelector(hash)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    const activeRole = getRole(role)
    const list = []
    list.push(
      {
        group: 'Actions',
        label: 'Start the 60-second tour',
        keywords: 'guide tour walkthrough help',
        run: () => window.dispatchEvent(new Event('guide:tour')),
      },
      {
        group: 'Actions',
        label: 'Open the site guide',
        keywords: 'guide bot questions faq',
        run: () => window.dispatchEvent(new Event('guide:open')),
      },
      {
        group: 'Actions',
        label: `Open resume${activeRole ? ` (${activeRole.label})` : ''}`,
        keywords: 'cv resume pdf download',
        run: () => window.open(activeRole ? activeRole.resume : profile.contact.resume, '_blank', 'noopener'),
      },
      {
        group: 'Actions',
        label: 'Send an email',
        keywords: 'contact mail hire',
        run: () => {
          window.location.href = `mailto:${profile.contact.email}`
        },
      },
    )
    roles.forEach((r) =>
      list.push({
        group: 'Hiring for',
        label: `Show the site for ${r.label} roles`,
        keywords: `role lens ${r.id} ${r.label}`,
        run: () => {
          setRole(r.id)
          go('#hero')()
        },
      }),
    )
    list.push({
      group: 'Hiring for',
      label: 'Show everything (clear the role)',
      keywords: 'reset all role',
      run: () => setRole('all'),
    })
    projects.forEach((p) =>
      list.push({
        group: 'Projects',
        label: shortTitle(p),
        hint: p.discipline,
        keywords: `${p.tagline} ${(p.tech || []).join(' ')} ${p.discipline}`,
        run: go(`#${p.id}`),
      }),
    )
    enabledSections
      .filter((s) => s.nav)
      .forEach((s) =>
        list.push({ group: 'Sections', label: s.nav, keywords: s.id, run: go(`#${s.id}`) }),
      )
    return list
  }, [role, setRole])

  const results = useMemo(() => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (terms.length === 0) return items
    return items.filter((it) => {
      const hay = `${it.label} ${it.keywords || ''} ${it.group}`.toLowerCase()
      return terms.every((t) => hay.includes(t))
    })
  }, [items, query])

  // open / close from anywhere
  useEffect(() => {
    const openIt = () => {
      returnFocus.current = document.activeElement
      setOpen(true)
      track('palette-open')
    }
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')
      if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        open ? close() : openIt()
      } else if (e.key === '/' && !typing && !open) {
        e.preventDefault()
        openIt()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_EVENT, openIt)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_EVENT, openIt)
    }
  }, [open, close])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])
  useEffect(() => setIndex(0), [query])
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [index, results])

  const choose = (item) => {
    if (!item) return
    track(`palette-${item.label.slice(0, 24)}`)
    close()
    // let the dialog unmount before scrolling or navigating
    setTimeout(item.run, 30)
  }

  const onInputKey = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[index])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  if (!open) return null

  let lastGroup = null
  return (
    <div
      className="no-print fixed inset-0 z-[60] flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to"
        className="w-full max-w-xl border border-line bg-bg shadow-lg"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} aria-hidden className="text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results[index] ? `palette-opt-${index}` : undefined}
            aria-label="Type a project, role, section or action"
            placeholder="Type a project, a role or an action"
            className="h-12 w-full bg-transparent text-base outline-none placeholder:text-muted"
          />
          <kbd className="hidden border border-line px-1.5 py-0.5 text-micro text-muted sm:block">Esc</kbd>
        </div>

        <ul
          id="palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-[50vh] overflow-y-auto py-2"
        >
          {results.length === 0 && <li className="px-4 py-6 text-small text-muted">Nothing matches that.</li>}
          {results.map((it, i) => {
            const header = it.group !== lastGroup
            lastGroup = it.group
            return (
              <li key={`${it.group}-${it.label}`} role="presentation">
                {header && <p className="px-4 pb-1 pt-3 text-micro text-muted">{it.group}</p>}
                <div
                  id={`palette-opt-${i}`}
                  role="option"
                  aria-selected={i === index}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => choose(it)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 px-4 py-2 text-small',
                    i === index ? 'bg-surface text-accent' : '',
                  )}
                >
                  <span>{it.label}</span>
                  {i === index ? (
                    <CornerDownLeft size={14} aria-hidden className="shrink-0" />
                  ) : (
                    it.hint && <span className="text-micro text-muted">{it.hint}</span>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="border-t border-line px-4 py-2 text-micro text-muted">
          Arrow keys to move, Enter to go. Ctrl+K opens this from anywhere.
        </p>
      </div>
    </div>
  )
}
