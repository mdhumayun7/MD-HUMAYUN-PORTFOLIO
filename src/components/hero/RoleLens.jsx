import { ArrowUpRight } from 'lucide-react'
import { roles, getRole } from '../../data/roles'
import { projects } from '../../data/projects'
import { useRole } from '../../hooks/useRole'
import { headlineMetrics, shortTitle } from '../../lib/projectMeta'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/cn'

/**
 * "I am hiring for" selector. Choosing a role changes the hero pitch, the
 * three "start here" links and the order of the project list. Nothing is
 * hidden -- "All" restores the default view.
 */
export function RoleLens() {
  const { role, setRole } = useRole()
  const active = getRole(role)
  const options = [{ id: 'all', label: 'Show everything' }, ...roles]

  const startHere = active
    ? active.lookFirst.map((id) => projects.find((p) => p.id === id)).filter(Boolean)
    : []

  return (
    <div className="mt-9 border-t border-line pt-6">
      <p id="role-lens-label" className="text-micro text-muted">
        I am hiring for
      </p>
      <div role="group" aria-labelledby="role-lens-label" className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => {
          const on = role === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={on}
              onClick={() => setRole(opt.id)}
              className={cn(
                'border px-3 py-1.5 text-small transition-colors',
                on
                  ? 'border-accent bg-accent text-bg'
                  : 'border-line text-muted hover:border-accent hover:text-accent',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      <div aria-live="polite">
        {active && (
          <div className="mt-5 max-w-prose">
            <p className="text-micro text-muted">Start here for {active.label.toLowerCase()} roles</p>
            <ol className="mt-2 divide-y divide-[var(--c-grey-200)] border-y border-line">
              {startHere.map((p, i) => {
                const m = headlineMetrics(p, 1)[0]
                return (
                  <li key={p.id}>
                    <a
                      href={`#${p.id}`}
                      onClick={() => track(`start-here-${p.id}`)}
                      className="group flex flex-col gap-0.5 py-2.5 text-small sm:flex-row sm:items-baseline sm:justify-between sm:gap-4
                                 transition-colors hover:text-accent"
                    >
                      <span>
                        <span className="nums mr-2 text-muted">{i + 1}</span>
                        {shortTitle(p)}
                      </span>
                      <span className="nums flex shrink-0 items-center gap-1 pl-5 text-micro text-muted group-hover:text-accent sm:pl-0">
                        {m ? `${m.value} ${m.label}` : ''}
                        <ArrowUpRight size={13} aria-hidden />
                      </span>
                    </a>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
