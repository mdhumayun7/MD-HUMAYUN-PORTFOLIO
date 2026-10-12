import { getRole, relevance } from '../../data/roles'
import { useRole } from '../../hooks/useRole'
import { headlineMetrics, projectBadges, shortTitle } from '../../lib/projectMeta'
import { track } from '../../lib/analytics'
import { Tag } from '../ui/Tag'

/**
 * A one-screen overview of every project, placed above the long entries. A
 * recruiter can scan twelve projects in ten seconds, see which have a video
 * or a live demo, and jump straight to the one that matches their role.
 */
export function ProjectIndex({ projects }) {
  const { role } = useRole()
  const active = getRole(role)

  return (
    <div className="mb-14">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-display text-h4 font-semibold">At a glance</h3>
        <p className="text-micro text-muted">
          {active ? `Ordered for ${active.label.toLowerCase()} roles` : 'Select a role in the hero to reorder'}
        </p>
      </div>

      <ul className="mt-5 grid gap-px border border-line bg-[var(--c-grey-200)] sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const metrics = headlineMetrics(p, 2)
          const badges = projectBadges(p)
          const recommended = active && relevance(p, active.id) >= 100 - 20
          return (
            <li key={p.id} className="bg-bg">
              <a
                href={`#${p.id}`}
                onClick={() => track(`index-${p.id}`)}
                className="group flex h-full flex-col p-5 transition-colors hover:bg-surface"
              >
                <div className="flex items-center justify-between gap-2">
                  <Tag tone="accent">{p.discipline}</Tag>
                  {recommended && <span className="text-micro text-accent">Start here</span>}
                </div>
                <h4 className="mt-3 font-display text-lead font-semibold leading-snug group-hover:text-accent">
                  {shortTitle(p)}
                </h4>
                <p className="mt-2 line-clamp-3 text-small text-muted">{p.tagline}</p>

                {metrics.length > 0 && (
                  <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                    {metrics.map((m) => (
                      <div key={m.label}>
                        <dd className="nums font-display text-base font-semibold leading-none">{m.value}</dd>
                        <dt className="mt-1 text-micro text-muted">{m.label}</dt>
                      </div>
                    ))}
                  </dl>
                )}

                <p className="mt-auto pt-4 text-micro text-muted">{badges.join(' · ')}</p>
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
