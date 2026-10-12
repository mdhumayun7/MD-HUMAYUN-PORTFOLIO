import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { enabledSections, site } from '../../config/site'
import { profile } from '../../data/profile'
import { Search } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { OPEN_EVENT } from './CommandPalette'
import { cn } from '../../lib/cn'

/**
 * The nav is generated from site.js -- reorder or disable a section there and
 * this menu follows automatically. Sections without a `nav` label (the hero)
 * are skipped.
 */
export function Header() {
  const [open, setOpen] = useState(false)
  const links = enabledSections.filter((s) => s.nav)

  // Close the mobile menu on Escape, and lock scroll while it is open.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-shell items-center justify-between px-5 sm:px-8">
        <a href="#hero" className="font-display text-lead font-semibold tracking-tight">
          {profile.name}
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {links.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="text-small text-muted transition-colors hover:text-accent"
            >
              {s.nav}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {site.features.commandPalette && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
              aria-label="Jump to a project, role or action"
              className="inline-flex h-9 items-center gap-2 border border-line px-2.5 text-micro text-muted
                         transition-colors hover:border-accent hover:text-accent"
            >
              <Search size={14} aria-hidden />
              <span className="hidden lg:inline">Jump to</span>
              <kbd className="hidden border border-line px-1 text-[11px] lg:inline">Ctrl K</kbd>
            </button>
          )}
          {site.features.themeToggle && <ThemeToggle />}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center border border-line
                       text-muted hover:border-accent hover:text-accent md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} aria-hidden /> : <Menu size={16} aria-hidden />}
          </button>
        </div>
      </div>

      {/* Mobile menu: full-width list, large tap targets, closes on selection. */}
      <div
        id="mobile-nav"
        className={cn(
          'border-t border-line bg-bg md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <nav aria-label="Sections" className="mx-auto max-w-shell px-5 py-2 sm:px-8">
          {links.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              className="block border-b border-line py-3 text-base last:border-0"
            >
              {s.nav}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
