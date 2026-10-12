// ===========================================================================
//  SITE GUIDE — the words the guide bot says.
//  Everything here is scripted from the site's own data. There is no AI model
//  and no backend behind it, so it can only say things that are true of this
//  site, and it never invents an answer.
// ===========================================================================

import { profile } from './profile'
import { projects } from './projects'
import { getRole, roles } from './roles'
import { headlineMetrics, projectBadges, shortTitle } from '../lib/projectMeta'

export const GREETING =
  'Hi, I am the site guide. Open me at the bottom left for a 60-second tour, or just scroll and I will point things out.'

/** One short line per section, shown when a section scrolls into view. */
export const SECTION_TIPS = {
  hero: 'That is the whole pitch. Pick a role under it and I will reorder the page for you.',
  about: 'The short version: the model is the easy half. The pipeline around it is where the work is.',
  projects:
    'Scan the grid first. The badges under each card tell you which ones have a video or a live demo.',
  notes: 'Three problems where the obvious approach was the wrong one, explained like at a whiteboard.',
  skills: 'Select a skill that shows a number and I will show you the projects that used it.',
  experience: 'Research, teaching and internships, newest first.',
  publications: 'One paper, under review at IEEE GSCON 2027. Under review means not accepted yet.',
  achievements: 'GATE CS 93.8 percentile and NPTEL rank 33 are the two numbers most recruiters check.',
  contact: 'Email is the fastest way. He is open to the roles listed here, and to research collaboration.',
}

export function projectTip(project, roleId) {
  const role = getRole(roleId)
  const m = headlineMetrics(project, 1)[0]
  const parts = [`${shortTitle(project)}.`, project.tagline]
  if (m) parts.push(`Headline number: ${m.value} ${m.label}.`)
  const badges = projectBadges(project)
  if (badges.length) parts.push(`Proof: ${badges.join(', ')}.`)
  if (role && role.lookFirst.includes(project.id)) parts.push(`Start-here pick for ${role.label} roles.`)
  return parts.join(' ')
}

const byId = (id) => projects.find((p) => p.id === id)
const link = (label, href, external) => ({ label, href, external })

/** The 60-second tour. Each step scrolls to `target` and says `text`. */
export function tourSteps(roleId) {
  const role = getRole(roleId)
  const firstId = role ? role.lookFirst[0] : 'ips-ml'
  const first = byId(firstId)
  const m = first ? headlineMetrics(first, 1)[0] : null
  return [
    {
      target: '#hero',
      title: 'The pitch',
      text: 'One sentence on what he builds, and the four numbers recruiters screen on: GATE percentile, NPTEL rank and both CGPAs.',
    },
    {
      target: '#role-lens-label',
      title: 'Choose a role',
      text: 'Pick the role you are hiring for. The pitch, the start-here list and the order of the projects all change. A role link like ?role=embedded opens the site this way.',
    },
    {
      target: '#projects',
      title: 'Work at a glance',
      text: 'Every project on one screen: the problem in a line, two measured numbers, and badges for video, demo, diagrams and code.',
    },
    first && {
      target: `#${first.id}`,
      title: `Start with ${shortTitle(first)}`,
      text: `${first.tagline}${m ? ` Headline number: ${m.value} ${m.label}.` : ''}`,
    },
    {
      target: '#skills',
      title: 'Skills with evidence',
      text: 'A number on a skill means that many projects used it. Select one to jump to them.',
    },
    {
      target: '#experience',
      title: 'Experience',
      text: 'MeitY-sponsored research, teaching assistant work at SVNIT, internships, and education in one timeline.',
    },
    {
      target: '#contact',
      title: 'Get in touch',
      text: 'Email goes straight to him. The resume button in the hero matches the role you picked.',
    },
  ].filter(Boolean)
}

/** Questions a recruiter is likely to have. `answer(roleId)` returns { text, links }. */
export const FAQ = [
  {
    q: 'What should I look at first?',
    answer(roleId) {
      const role = getRole(roleId)
      const ids = role ? role.lookFirst : ['ips-ml', 'drone-swarm', 'smart-home-surveillance']
      return {
        text: role
          ? `For ${role.label} roles, in this order:`
          : 'One project from each field, to see the range:',
        links: ids.map(byId).filter(Boolean).map((p) => link(shortTitle(p), `#${p.id}`)),
      }
    },
  },
  {
    q: 'What has he actually measured?',
    answer() {
      const ids = ['ips-ml', 'ddos-sdn', 'drone-swarm', 'smart-home-surveillance']
      const lines = ids
        .map(byId)
        .filter(Boolean)
        .map((p) => {
          const ms = headlineMetrics(p, 2)
          return `${shortTitle(p)}: ${ms.map((m) => `${m.value} ${m.label.toLowerCase()}`).join(', ')}`
        })
      return {
        text: `${lines.join('. ')}.`,
        links: ids.map(byId).filter(Boolean).map((p) => link(shortTitle(p), `#${p.id}`)),
      }
    },
  },
  {
    q: 'Which projects have a video or a live demo?',
    answer() {
      const withProof = projects.filter((p) => {
        const b = projectBadges(p)
        return b.includes('Video') || b.includes('Interactive demo')
      })
      return {
        text: `${withProof.length} projects have a video or an interactive demo. Each demo says what is measured and what is illustrative.`,
        links: withProof.map((p) => link(shortTitle(p), `#${p.id}`)),
      }
    },
  },
  {
    q: 'How do I verify the claims?',
    answer() {
      return {
        text: 'Each project links to its repository, and the numbers come from results stored there. Where a demo is illustrative rather than measured, the note under it says so. The one paper is marked under review, not published.',
        links: [link('GitHub', profile.contact.github, true)],
      }
    },
  },
  {
    q: 'Is he available, and where?',
    answer() {
      return {
        text: `${profile.availability} Based in ${profile.location}.`,
        links: [
          link('Email', `mailto:${profile.contact.email}`),
          link('LinkedIn', profile.contact.linkedin, true),
        ],
      }
    },
  },
  {
    q: 'Where is the resume?',
    answer(roleId) {
      const role = getRole(roleId)
      const file = role ? role.resume : profile.contact.resume
      return {
        text: role
          ? `This is the ${role.label} version, matching the role you picked. The others:`
          : 'The default resume. Pick a role in the hero for a version tailored to it.',
        links: [
          link(role ? `${role.label} resume (PDF)` : 'Resume (PDF)', file, true),
          ...roles.filter((r) => !role || r.id !== role.id).map((r) => link(`${r.label}`, r.resume, true)),
        ],
      }
    },
  },
]
