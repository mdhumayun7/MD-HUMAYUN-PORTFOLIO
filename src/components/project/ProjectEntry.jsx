import { Suspense } from 'react'
import { site } from '../../config/site'
import { Figure } from '../diagrams/Figure'
import { getSimulation } from '../simulations/registry'
import { DeepDive } from './DeepDive'
import { LinkRow } from './LinkRow'
import { MetricList } from './MetricList'
import { TechChips } from './TechChips'
import { Tag } from '../ui/Tag'
import { cn } from '../../lib/cn'

const STATUS_COPY = {
  research: 'Research',
  shipped: 'Built',
  archived: 'Archive',
}

/**
 * A full-width project entry, separated from its neighbours by a rule rather
 * than boxed in a card. Every optional field is guarded, so a project with
 * only a title and a description still renders correctly.
 */
export function ProjectEntry({ project, figures }) {
  const simulationEntries = site.features.simulations
    ? project.simulationIds || (project.simulationId ? [{ id: project.simulationId }] : [])
    : []
  const archFigure = figures.find((f) => f.key === `${project.id}-arch`)
  const flowFigure = figures.find((f) => f.key === `${project.id}-flow`)

  return (
    <article
      id={project.id}
      className="scroll-mt-24 border-t border-line py-12 first:border-t-0 md:py-16"
    >
      <div className="grid gap-x-12 gap-y-6 md:grid-cols-[minmax(0,1fr)_240px]">
        {/* ---- Main column ------------------------------------------- */}
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Tag tone="accent">{project.discipline}</Tag>
            {project.status && <span className="text-micro text-muted">{STATUS_COPY[project.status]}</span>}
            {project.featured && <span className="text-micro text-muted">Selected work</span>}
          </div>

          <h3
            className={cn(
              'font-display font-semibold',
              project.featured ? 'text-h3 md:text-h2' : 'text-h4 md:text-h3',
            )}
          >
            {project.title}
          </h3>

          <p className="mt-3 max-w-prose text-lead text-muted">{project.tagline}</p>

          <div className="mt-8 max-w-prose space-y-6">
            <div>
              <h4 className="text-micro text-muted">The problem</h4>
              <p className="mt-1.5 text-base">{project.problem}</p>
            </div>
            <div>
              <h4 className="text-micro text-muted">What I did</h4>
              <p className="mt-1.5 text-base">{project.contribution}</p>
            </div>
          </div>

          {project.metrics && (
            <div className="mt-8">
              <MetricList metrics={project.metrics} />
            </div>
          )}

          {/* Diagrams: architecture first, then the workflow. */}
          {archFigure && <Figure figure={archFigure} spec={project.diagrams.arch} />}
          {flowFigure && <Figure figure={flowFigure} spec={project.diagrams.flow} />}

          {simulationEntries.map(({ id, label }) => {
            const Simulation = getSimulation(id)
            if (!Simulation) return null
            return (
              <div key={id}>
                {label && (
                  <p className="mb-2 mt-8 text-micro text-muted first:mt-0">{label}</p>
                )}
                <Suspense
                  fallback={
                    <div className="my-8 border border-line p-4 text-small text-muted">
                      Loading the interactive demo…
                    </div>
                  }
                >
                  <Simulation />
                </Suspense>
              </div>
            )
          })}

          {project.deepDive && (
            <div className="mt-8">
              <DeepDive sections={project.deepDive} />
            </div>
          )}
        </div>

        {/* ---- Side column ------------------------------------------- */}
        <aside className="space-y-6 md:pt-14">
          <div>
            <h4 className="mb-2 text-micro text-muted">Period</h4>
            <p className="text-small">{project.period}</p>
          </div>
          {project.tech && project.tech.length > 0 && (
            <div>
              <h4 className="mb-2 text-micro text-muted">Stack</h4>
              <TechChips items={project.tech} />
            </div>
          )}
          {project.links && (
            <div>
              <h4 className="mb-2 text-micro text-muted">Links</h4>
              <LinkRow links={project.links} title={project.title} />
            </div>
          )}
        </aside>
      </div>
    </article>
  )
}
