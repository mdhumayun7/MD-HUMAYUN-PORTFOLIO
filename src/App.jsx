import { useEffect, useMemo } from 'react'
import { enabledSections, site } from './config/site'
import { projects } from './data/projects'
import { buildFigureIndex } from './lib/figureRegistry'
import { initAnalytics } from './lib/analytics'
import { RoleProvider } from './hooks/useRole'

import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { SkipLink } from './components/layout/SkipLink'
import { FigureRail } from './components/layout/FigureRail'
import { StickyActions } from './components/layout/StickyActions'

import { Hero } from './components/sections/Hero'
import { About } from './components/sections/About'
import { Projects } from './components/sections/Projects'
import { Skills } from './components/sections/Skills'
import { Notes } from './components/sections/Notes'
import { Timeline } from './components/sections/Timeline'
import { Publications } from './components/sections/Publications'
import { Achievements } from './components/sections/Achievements'
import { Contact } from './components/sections/Contact'

/**
 * Sections are rendered from the array in src/config/site.js, so reordering
 * the page is a data change rather than a code change. Anything not listed
 * there simply never renders.
 */
export default function App() {
  const figures = useMemo(() => buildFigureIndex(projects), [])
  useEffect(() => initAnalytics(), [])

  const REGISTRY = {
    hero: <Hero />,
    about: <About />,
    projects: <Projects figures={figures} />,
    skills: <Skills />,
    notes: <Notes />,
    experience: <Timeline />,
    publications: <Publications />,
    achievements: <Achievements />,
    contact: <Contact />,
  }

  return (
    <RoleProvider>
      <SkipLink />
      <Header />
      {site.features.figureRail && <FigureRail figures={figures} />}

      <main id="main">
        {enabledSections.map((section) => {
          const node = REGISTRY[section.id]
          if (!node) {
            // A section is listed in config but has no component behind it.
            if (import.meta.env.DEV) {
              console.warn(`[site.js] No component registered for section "${section.id}"`)
            }
            return null
          }
          return <div key={section.id}>{node}</div>
        })}
      </main>

      <Footer />
      {site.features.stickyActions && <StickyActions />}
    </RoleProvider>
  )
}
