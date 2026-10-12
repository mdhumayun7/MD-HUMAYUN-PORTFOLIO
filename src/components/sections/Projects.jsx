import { site } from '../../config/site'
import { disciplines, projects } from '../../data/projects'
import { relevance } from '../../data/roles'
import { useRole } from '../../hooks/useRole'
import { demoCount } from '../../lib/projectMeta'
import { ProjectIndex } from '../project/ProjectIndex'
import { useProjectFilter } from '../../hooks/useProjectFilter'
import { Section } from '../layout/Section'
import { ProjectEntry } from '../project/ProjectEntry'
import { ProjectFilter } from '../project/ProjectFilter'
import { SecondaryEntry } from '../project/SecondaryEntry'

/**
 * Featured projects first, then the rest in the order they appear in the data
 * file. Figure numbers are passed down from App so they stay stable when the
 * visitor filters the list.
 */
export function Projects({ figures }) {
  const filter = useProjectFilter(projects)
  const { role } = useRole()

  // Three tiers: featured work, then the rest, then earlier work compressed
  // into a list. Sorting here rather than in the data file means the data file
  // stays a plain record of what exists.
  const primary = filter.filtered
    .filter((p) => !p.secondary)
    .sort((a, b) => {
      // With a role selected, relevance decides; otherwise featured work leads.
      // Array.sort is stable, so ties keep the order of the data file.
      if (role !== 'all') {
        const d = relevance(b, role) - relevance(a, role)
        if (d !== 0) return d
      }
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
    })
  const secondary = filter.filtered.filter((p) => p.secondary)
  const ordered = [...primary, ...secondary]

  return (
    <Section
      id="projects"
      title="Work"
      lead={`Each entry states the problem, what I built, and what it measured. Diagrams are numbered figures; ${demoCount(projects)} projects have an interactive demo and one has a recorded walkthrough.`}
    >
      <ProjectIndex projects={primary} />

      {site.features.filterBar && (
        <ProjectFilter
          disciplines={disciplines}
          discipline={filter.discipline}
          setDiscipline={filter.setDiscipline}
          techOptions={filter.techOptions}
          tech={filter.tech}
          setTech={filter.setTech}
          count={ordered.length}
          total={projects.length}
        />
      )}

      {ordered.length === 0 ? (
        <div className="border border-line p-8 text-center">
          <p className="text-base">No project matches both filters.</p>
          <button
            type="button"
            onClick={filter.reset}
            className="mt-3 border-b border-accent pb-px text-small text-accent"
          >
            Clear the filters
          </button>
        </div>
      ) : (
        <div>
          {primary.map((project) => (
            <ProjectEntry key={project.id} project={project} figures={figures} />
          ))}

          {secondary.length > 0 && (
            <div className="pt-12">
              <h3 className="font-display text-h4 font-semibold">Earlier work</h3>
              <p className="mt-2 max-w-prose text-small text-muted">
                Built while learning the tools I now use for the work above.
              </p>
              <ul className="mt-6">
                {secondary.map((project) => (
                  <SecondaryEntry key={project.id} project={project} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}
