// ===========================================================================
//  ROLE LENSES
//  A recruiter picks the kind of role they are hiring for and the page
//  re-orders itself: the hero pitch changes, the three "start here" projects
//  change, and the project list is sorted by relevance. Nothing is hidden and
//  nothing is invented -- every line below restates a fact that is already
//  documented in a project entry.
//
//  id          used in the URL: .../?role=embedded
//  lookFirst   project ids, best first. These become the "Start here" links
//              and rank highest in the project list.
//  resume      path under /public. Until a role-specific PDF is added, every
//              role points at resume.pdf. To add one: drop the PDF into
//              public/ and change the path here.
// ===========================================================================

export const roles = [
  {
    id: 'ml',
    label: 'ML Engineer',
    pitch:
      'I build machine learning systems that are evaluated as parts of real infrastructure: an intrusion prevention engine measured on 2.5 million flows, a hybrid LLM and PPO drone-swarm commander benchmarked across seven architectures, and a retrieval assistant that runs on local inference.',
    lookFirst: ['ips-ml', 'drone-swarm', 'vae-latent-space'],
    resume: 'resume.pdf',
  },
  {
    id: 'sde',
    label: 'Software Engineer',
    pitch:
      'C++ and Python engineer, GATE CS 93.8 percentile. I build pipelines and systems that are tested and degrade gracefully: an eight-stage ingestion pipeline over 11 sources, class-level system design with UML, and embedded firmware whose safety logic never waits on the network.',
    lookFirst: ['job-agent', 'backend-system-design', 'smart-home-surveillance'],
    resume: 'resume.pdf',
  },
  {
    id: 'embedded',
    label: 'Embedded & Systems',
    pitch:
      'I write firmware where the part that decides never waits on the part that reports: ESP32 safety logic on one core, networking on the other, FreeRTOS queues between them, and host-side tests that cover 32-bit clock wrap-around. I also build simulators for autonomous drone swarms.',
    lookFirst: ['smart-home-surveillance', 'drone-swarm', 'ddos-sdn'],
    resume: 'resume.pdf',
  },
  {
    id: 'security',
    label: 'Security & Research',
    pitch:
      'M.Tech in Information Security and Privacy. My work treats a detector as a control system: an inline intrusion prevention engine with SHAP explanations in the enforcement path, and an SDN DDoS detector and mitigator measured under live attack traffic.',
    lookFirst: ['ips-ml', 'ddos-sdn', 'drone-swarm'],
    resume: 'resume.pdf',
  },
]

export const DEFAULT_ROLE = 'all'

export function getRole(id) {
  return roles.find((r) => r.id === id) || null
}

/**
 * Relevance of a project for a role. Projects named in `lookFirst` rank by
 * their position there; projects that merely list the role come next; the
 * rest keep their original order after those.
 */
export function relevance(project, roleId) {
  const role = getRole(roleId)
  if (!role) return 0
  const i = role.lookFirst.indexOf(project.id)
  if (i >= 0) return 100 - i * 10
  if ((project.roles || []).includes(roleId)) return 10
  return 0
}
