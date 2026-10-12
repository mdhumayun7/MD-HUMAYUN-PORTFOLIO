import { projects } from '../data/projects'

// ===========================================================================
//  SKILL -> PROJECT EVIDENCE
//  A skill is linked to a project when the project's `tech` list names it
//  (word-for-word, so "Git" does not match "GitHub Actions"), or when it is
//  listed in EXPLICIT below for things a tech chip cannot express, such as
//  "System Design". Only link a skill to a project that really used it.
// ===========================================================================

const EXPLICIT = {
  'System Design': ['backend-system-design', 'smart-home-surveillance'],
  'OOP & Design Patterns': ['backend-system-design'],
  'Computer Networks': ['ddos-sdn'],
  VAE: ['vae-latent-space'],
  'Reinforcement Learning': ['drone-swarm'],
  'RAG pipelines': ['medical-rag'],
  SDN: ['ddos-sdn'],
  Arduino: ['smart-home-surveillance'],
  'Raspberry Pi': ['smart-home-surveillance'],
  'I2C and GPIO': ['smart-home-surveillance'],
  'Embedded C++': ['smart-home-surveillance'],
}

const words = (text) =>
  text
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .split(/[^a-z0-9+#.]+/)
    .filter(Boolean)

const subset = (a, b) => a.length > 0 && a.every((w) => b.includes(w))

/** Project ids that give evidence for a skill. */
export function projectsForSkill(skill) {
  const ids = new Set(EXPLICIT[skill] || [])
  const sw = words(skill)
  projects.forEach((p) => {
    ;(p.tech || []).forEach((t) => {
      const tw = words(t)
      if (subset(sw, tw) || subset(tw, sw)) ids.add(p.id)
    })
  })
  return projects.filter((p) => ids.has(p.id))
}
