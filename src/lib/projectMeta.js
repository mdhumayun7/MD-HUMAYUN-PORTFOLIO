// Small helpers shared by the hero, the project overview and the share pages.

/** "IPS-ML / ShieldNet — Intrusion Prevention..." -> "IPS-ML / ShieldNet" */
export function shortTitle(project) {
  return project.title.split(' — ')[0]
}

/** The first one or two metrics, as short strings for compact cards. */
export function headlineMetrics(project, n = 2) {
  return (project.metrics || []).slice(0, n)
}

/** Which proof formats a project offers, for the badges on overview cards. */
export function projectBadges(project) {
  const badges = []
  if (project.video || (project.links && project.links.video)) badges.push('Video')
  if (project.simulationId || (project.simulationIds && project.simulationIds.length)) badges.push('Interactive demo')
  if (project.diagrams) badges.push('Diagrams')
  if (project.links && project.links.paper) badges.push('Paper')
  if (project.links && project.links.repo) badges.push('Code')
  return badges
}

export function demoCount(projects) {
  return projects.filter(
    (p) => p.simulationId || (p.simulationIds && p.simulationIds.length),
  ).length
}
