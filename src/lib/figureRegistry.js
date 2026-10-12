// ===========================================================================
//  FIGURE NUMBERING
//
//  The site's signature element: every diagram is a numbered figure, like a
//  paper. Numbers are computed from the FULL project list, not the filtered
//  one, so "Fig. 2.4" always refers to the same diagram no matter which
//  filter the visitor has applied.
//
//  Chapter 2 is the projects section. If you ever add figures to another
//  section, give it its own chapter number here.
// ===========================================================================

const PROJECT_CHAPTER = 2

/**
 * Walk every project in order and assign each of its diagrams a number.
 * Returns a flat array: [{ key, number, projectId, kind, caption, title }]
 */
export function buildFigureIndex(projects) {
  const figures = []
  let n = 0

  projects.forEach((project) => {
    if (!project.diagrams) return
    // Hardware, then software architecture, then workflow -- consistent reading order.
    ;['hw', 'arch', 'flow'].forEach((kind) => {
      const diagram = project.diagrams[kind]
      if (!diagram) return
      n += 1
      figures.push({
        key: `${project.id}-${kind}`,
        number: `${PROJECT_CHAPTER}.${n}`,
        projectId: project.id,
        projectTitle: project.title,
        kind,
        caption: diagram.caption,
      })
    })
  })

  return figures
}

/** Convenience: id -> figure record, for lookups inside a project card. */
export function figureMap(figures) {
  return figures.reduce((acc, f) => {
    acc[f.key] = f
    return acc
  }, {})
}
