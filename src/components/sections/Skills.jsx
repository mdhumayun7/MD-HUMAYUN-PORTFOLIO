import { useState } from 'react'
import { skills } from '../../data/skills'
import { projectsForSkill } from '../../lib/skillMatch'
import { shortTitle } from '../../lib/projectMeta'
import { track } from '../../lib/analytics'
import { cn } from '../../lib/cn'
import { Section } from '../layout/Section'

export function Skills() {
  const [selected, setSelected] = useState(null)
  const evidence = selected ? projectsForSkill(selected) : []

  const toggle = (item) => {
    setSelected((cur) => (cur === item ? null : item))
    track(`skill-${item}`)
  }

  return (
    <Section
      id="skills"
      title="Skills"
      lead="Grouped by what they are used for. No proficiency percentages. Select a skill that shows a count to see the projects that used it."
    >
      <div className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {skills.map((group) => (
          <div key={group.category}>
            <h3 className="font-display text-lead font-semibold">{group.category}</h3>
            {group.note && <p className="mt-1 text-micro text-muted">{group.note}</p>}
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {group.items.map((item) => {
                const count = projectsForSkill(item).length
                const on = selected === item
                if (count === 0) {
                  return (
                    <li key={item}>
                      <span className="inline-block border border-line px-2 py-[2px] text-micro leading-none text-muted">
                        {item}
                      </span>
                    </li>
                  )
                }
                return (
                  <li key={item}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle(item)}
                      className={cn(
                        'inline-flex items-center gap-1.5 border px-2 py-[2px] text-micro leading-none transition-colors',
                        on
                          ? 'border-accent bg-accent text-bg'
                          : 'border-line text-muted hover:border-accent hover:text-accent',
                      )}
                    >
                      {item}
                      <span className={cn('nums', on ? 'text-bg' : 'text-accent')}>{count}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="mt-10 min-h-[3.5rem] border-t border-line pt-5">
        {selected && (
          <>
            <p className="text-micro text-muted">
              {selected} was used in {evidence.length} {evidence.length === 1 ? 'project' : 'projects'}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {evidence.map((p) => (
                <li key={p.id}>
                  <a
                    href={`#${p.id}`}
                    className="border-b border-transparent pb-px text-small hover:border-accent hover:text-accent"
                  >
                    {shortTitle(p)}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Section>
  )
}
