import { motion } from 'framer-motion'
import { ArrowUpRight, Code2, FileDown, Github, Linkedin, Mail } from 'lucide-react'
import { profile } from '../../data/profile'
import { getRole } from '../../data/roles'
import { site } from '../../config/site'
import { useRole } from '../../hooks/useRole'
import { track } from '../../lib/analytics'
import { RoleLens } from '../hero/RoleLens'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { Button } from '../ui/Button'

/**
 * The one orchestrated motion moment on the site: a short staggered settle on
 * first load. Nothing else animates on scroll except the diagrams drawing in.
 */
export function Hero() {
  const reduced = useReducedMotion()
  const { role } = useRole()
  const activeRole = getRole(role)
  const pitch = activeRole ? activeRole.pitch : profile.pitch
  const resume = activeRole ? activeRole.resume : profile.contact.resume

  const stagger = (i) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] },
        }

  return (
    <section id="hero" className="scroll-mt-24 pb-section-sm pt-16 md:pb-section md:pt-24">
      <div className="mx-auto w-full max-w-shell px-5 sm:px-8">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_260px] md:gap-16">
          <div className="min-w-0">
            <motion.p {...stagger(0)} className="text-small text-muted">
              {profile.title}
            </motion.p>

            <motion.h1
              {...stagger(1)}
              className="mt-3 font-display text-h2 font-semibold md:text-h1"
            >
              {profile.name}
            </motion.h1>

            <motion.p {...stagger(2)} className="mt-6 max-w-prose text-lead">
              {pitch}
            </motion.p>

            <motion.div {...stagger(3)} className="mt-9 flex flex-wrap gap-3">
              <Button href={resume} external variant="primary" onClick={() => track('resume-download')}>
                <FileDown size={15} aria-hidden />
                Resume
              </Button>
              <Button href={profile.contact.github} external variant="secondary">
                <Github size={15} aria-hidden />
                GitHub
              </Button>
              <Button href={profile.contact.linkedin} external variant="secondary">
                <Linkedin size={15} aria-hidden />
                LinkedIn
              </Button>
              <Button href={profile.contact.leetcode} external variant="secondary">
                <Code2 size={15} aria-hidden />
                LeetCode
              </Button>
              <Button href={`mailto:${profile.contact.email}`} variant="secondary">
                <Mail size={15} aria-hidden />
                Email
              </Button>
            </motion.div>

            {site.features.roleLens && <RoleLens />}

            {/* Credentials strip. Static values, deliberately not animated
                counters -- a number that ticks up reads as decoration and
                recruiters scroll past it. */}
            {profile.credentials && (
              <motion.dl
                {...stagger(4)}
                className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-6 sm:grid-cols-4"
              >
                {profile.credentials.map((c) => (
                  <div key={c.label}>
                    <dd className="nums font-display text-h4 font-semibold leading-none">
                      {c.value}
                    </dd>
                    <dt className="mt-1.5 text-micro text-muted">{c.label}</dt>
                  </div>
                ))}
              </motion.dl>
            )}

            <motion.a
              {...stagger(5)}
              href="#projects"
              className="mt-8 inline-flex items-center gap-1.5 border-b border-line pb-1 text-small
                         text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Read the work
              <ArrowUpRight size={14} aria-hidden />
            </motion.a>
          </div>

          {/* Photo, in colour. The source is a white-background studio shot,
              so in dark mode the white surround is knocked back with a blend
              mode rather than left as a bright rectangle. */}
          <motion.div {...stagger(2)} className="order-first md:order-none">
            <div className="relative w-40 overflow-hidden bg-surface md:w-full">
              <picture>
                <source srcSet={profile.photo.src} type="image/webp" />
                <img
                  src={profile.photo.fallback}
                  alt={profile.photo.alt}
                  width="800"
                  height="800"
                  className="block w-full mix-blend-multiply dark:mix-blend-normal"
                />
              </picture>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
