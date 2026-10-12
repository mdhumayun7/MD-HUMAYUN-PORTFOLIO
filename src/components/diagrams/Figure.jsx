import { ArchDiagram } from './ArchDiagram'
import { FlowDiagram } from './FlowDiagram'
import { useReducedMotion } from '../../hooks/useReducedMotion'

/**
 * Wraps a diagram in its figure number and caption, and registers it with the
 * margin rail via `data-figure`. This is the component that makes the site
 * read like a paper rather than a portfolio.
 */
export function Figure({ figure, spec }) {
  const reduced = useReducedMotion()
  if (!figure || !spec) return null

  const Diagram = figure.kind === 'arch' || figure.kind === 'hw' ? ArchDiagram : FlowDiagram

  return (
    <figure
      id={`fig-${figure.key}`}
      data-figure={figure.key}
      className="my-8 scroll-mt-28 border-t border-line pt-4"
    >
      <div className="mb-4 overflow-hidden">
        <Diagram spec={spec} animate={!reduced} />
      </div>
      <figcaption className="text-micro text-muted">
        <span className="nums mr-2 text-accent">Fig. {figure.number}</span>
        {spec.caption}
      </figcaption>
    </figure>
  )
}
