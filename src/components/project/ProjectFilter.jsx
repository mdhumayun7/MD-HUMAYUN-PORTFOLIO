import { cn } from '../../lib/cn'

function FilterGroup({ legend, options, value, onChange, allLabel }) {
  return (
    <fieldset className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
      <legend className="sr-only">{legend}</legend>
      <span aria-hidden className="text-micro text-muted">
        {legend}
      </span>
      {[{ id: 'all', label: allLabel }, ...options.map((o) => ({ id: o, label: o }))].map((opt) => {
        const active = value === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              'border px-3 py-1.5 text-micro transition-colors sm:px-2.5 sm:py-1',
              active
                ? 'border-accent bg-accent text-bg'
                : 'border-line text-muted hover:border-accent hover:text-accent',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </fieldset>
  )
}

export function ProjectFilter({
  disciplines,
  discipline,
  setDiscipline,
  techOptions,
  tech,
  setTech,
  count,
  total,
}) {
  return (
    <div className="mb-12 space-y-3 border-y border-line py-5">
      <FilterGroup
        legend="Field"
        allLabel="Everything"
        options={disciplines}
        value={discipline}
        onChange={setDiscipline}
      />
      <FilterGroup
        legend="Stack"
        allLabel="Any"
        options={techOptions}
        value={tech}
        onChange={setTech}
      />
      {/* Announced to screen readers when the count changes. */}
      <p aria-live="polite" className="nums text-micro text-muted">
        Showing {count} of {total} projects
      </p>
    </div>
  )
}
