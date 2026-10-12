import { useEffect, useState } from 'react'
import { FileDown, Mail } from 'lucide-react'
import { profile } from '../../data/profile'
import { getRole } from '../../data/roles'
import { useRole } from '../../hooks/useRole'
import { track } from '../../lib/analytics'

/**
 * A slim Resume / Email bar that appears once the hero has scrolled away, so
 * a recruiter who has read halfway down never has to scroll back to act.
 * Hidden again while the contact section is on screen, where it would repeat it.
 */
export function StickyActions() {
  const { role } = useRole()
  const [pastHero, setPastHero] = useState(false)
  const [atContact, setAtContact] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const hero = document.getElementById('hero')
    const contact = document.getElementById('contact')
    const observers = []
    if (hero) {
      const o = new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting), { threshold: 0 })
      o.observe(hero)
      observers.push(o)
    }
    if (contact) {
      const o = new IntersectionObserver(([e]) => setAtContact(e.isIntersecting), { threshold: 0.15 })
      o.observe(contact)
      observers.push(o)
    }
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const visible = pastHero && !atContact
  const resume = (getRole(role) || {}).resume || profile.contact.resume

  return (
    <div
      aria-hidden={!visible}
      className={`no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur
                  transition-transform duration-200 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:border
                  ${visible ? 'translate-y-0' : 'pointer-events-none translate-y-full sm:translate-y-[200%]'}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:gap-3">
        <a
          href={resume}
          target="_blank"
          rel="noreferrer noopener"
          tabIndex={visible ? 0 : -1}
          onClick={() => track('resume-download-sticky')}
          className="inline-flex flex-1 items-center justify-center gap-2 border border-accent bg-accent px-4 py-2
                     text-small font-medium text-bg hover:opacity-90 sm:flex-none"
        >
          <FileDown size={15} aria-hidden />
          Resume
        </a>
        <a
          href={`mailto:${profile.contact.email}`}
          tabIndex={visible ? 0 : -1}
          onClick={() => track('email-click-sticky')}
          className="inline-flex flex-1 items-center justify-center gap-2 border border-line px-4 py-2 text-small
                     hover:border-accent hover:text-accent sm:flex-none"
        >
          <Mail size={15} aria-hidden />
          Email
        </a>
      </div>
    </div>
  )
}
