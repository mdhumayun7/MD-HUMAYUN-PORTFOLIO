# Content guide

Everything on the site comes from files in `src/data/` and `src/config/`.
You should never need to open a component to change content.

After any edit: `npm run dev` to check locally, then `git push` to publish.

---

## 1. Adding a project

Open `src/data/projects.js` and add one object to the array. Only the first
eight fields are required; leave out anything you do not have and the card
still renders correctly.

```js
{
  id: 'my-project',                       // unique, becomes the #anchor
  title: 'What the project is called',
  tagline: 'One line. Under 90 characters.',
  discipline: 'ML',                       // 'ML' | 'Systems' | 'Security' | 'Automation'
  period: 'Mar 2026 - Jun 2026',
  tech: ['Python', 'Docker'],
  problem: 'What needed solving, in two or three sentences.',
  contribution: 'What you specifically built. This is the part recruiters read.',

  // --- everything below is optional ---
  featured: true,                         // renders first, larger heading
  status: 'shipped',                      // 'shipped' | 'research' | 'archived'
  metrics: [
    { label: 'Throughput', value: '54.3 -> 31 Gbps' },
  ],
  deepDive: [
    { heading: 'A design decision worth explaining', body: 'A paragraph.' },
  ],
  links: {
    repo: 'https://github.com/mdhumayun7/my-project',
    demo: 'https://example.com',
    paper: 'https://arxiv.org/abs/0000.00000',
    video: 'https://drive.google.com/...',
  },
}
```

A new `discipline` value appears in the filter bar automatically — the filter
options are derived from the data, not hardcoded.

---

## 2. Adding diagrams to a project

Diagrams are **written as data**, not drawn. Add a `diagrams` key to the
project and the SVG is generated, numbered, themed, and registered with the
margin rail for you.

**Architecture diagram** — columns of boxes with arrows between them:

```js
diagrams: {
  arch: {
    caption: 'Shown under the figure. Say what the reader should notice.',
    lanes: [
      { title: 'Input',   nodes: [{ id: 'src', label: 'Source', note: 'small second line' }] },
      { title: 'Process', nodes: [{ id: 'proc', label: 'Worker' }, { id: 'q', label: 'Queue' }] },
      { title: 'Output',  nodes: [{ id: 'out', label: 'Result' }] },
    ],
    links: [
      { from: 'src',  to: 'proc' },
      { from: 'proc', to: 'q' },
      { from: 'q',    to: 'out', label: 'optional edge label' },
    ],
  },
```

**Workflow diagram** — a left-to-right chain, with an optional feedback loop:

```js
  flow: {
    caption: 'One run, end to end.',
    steps: [
      { id: 'a', label: 'Collect', detail: 'small second line' },
      { id: 'b', label: 'Process' },
      { id: 'c', label: 'Ship' },
    ],
    loop: { from: 'c', to: 'a', label: 'nightly' },   // optional
  },
}
```

Rules of thumb: keep lanes to four or fewer and nodes per lane to four or
fewer, or the figure gets too wide for a phone to read comfortably.
Node ids only need to be unique inside their own project.

---

## 3. Adding an interactive demo

1. Create `src/components/simulations/MyThingSim.jsx`:

```jsx
import { useState } from 'react'
import { SimShell, SimSlider } from './SimShell'

export function MyThingSim() {
  const [value, setValue] = useState(0)

  return (
    <SimShell
      title="What the visitor is looking at"
      onReset={() => setValue(0)}
      note="State plainly what is measured and what is illustrative."
      controls={
        <SimSlider
          id="my-thing" label="Some parameter" value={value}
          min={0} max={100} onChange={setValue} display={`${value}%`}
        />
      }
    >
      {/* your visualisation */}
    </SimShell>
  )
}
```

2. Register it in `src/components/simulations/registry.js`:

```js
'my-thing': lazy(() => import('./MyThingSim').then((m) => ({ default: m.MyThingSim }))),
```

3. Point a project at it in `projects.js`: `simulationId: 'my-thing'`

Demos are lazy-loaded, so adding one does not slow the initial page load.
Keep the `note` honest — it is the reason the demos are credible.

---

## 4. Adding a skill

`src/data/skills.js`. Add a string to an existing `items` array, or add a
whole new group:

```js
{ category: 'Data engineering', items: ['Spark', 'Airflow'], note: 'optional context' },
```

There is deliberately no proficiency number in the schema.

---

## 5. Adding a job or degree

`src/data/experience.js`, newest first. `type: 'work'` gets a filled marker on
the timeline, `type: 'education'` gets a hollow one.

```js
{
  type: 'work',
  role: 'Software Engineer',
  org: 'Company',
  period: 'Aug 2026 - Present',
  location: 'Bengaluru, India',
  guide: 'optional, for research roles',
  bullets: ['What you did, with a number in it where possible.'],
  tech: ['Go', 'Kubernetes'],
}
```

---

## 6. Adding a whole new section

1. Create the content file, e.g. `src/data/talks.js`.
2. Create `src/components/sections/Talks.jsx`, using the shared wrapper so
   spacing matches everything else:

```jsx
import { talks } from '../../data/talks'
import { Section } from '../layout/Section'

export function Talks() {
  return (
    <Section id="talks" title="Talks" lead="Optional line under the heading.">
      {/* your markup */}
    </Section>
  )
}
```

3. Import it in `src/App.jsx` and add one line to the `REGISTRY` object:
   `talks: <Talks />,`
4. Add it to `sections` in `src/config/site.js`, in the position you want it:

```js
{ id: 'talks', enabled: true, nav: 'Talks' },
```

The nav menu updates itself. Omit `nav` to keep a section off the menu.

---

## 7. Reordering or hiding sections

`src/config/site.js` only. Move a line to reorder the page; set
`enabled: false` to remove a section and its nav entry together.

---

## 8. Changing colours

Edit `src/index.css`. The `:root` block is light mode, the `.dark` block is
dark mode. Change the hex values and the whole site follows.

```css
:root  { --c-accent: #0E5A5B; }
.dark  { --c-accent: #45B3AA; }
```

Also update the mirrored values in `src/config/site.js` (documentation only)
and the `<rect fill>` in `public/favicon.svg`.

**Check contrast before you commit** at https://webaim.org/resources/contrastchecker/ —
you want 4.5:1 or better for text against the background.

---

## 9. Changing fonts

Three places, all required:

1. `index.html` — the Google Fonts `<link>`
2. `tailwind.config.js` — the `fontFamily.display` / `fontFamily.body` arrays
3. `src/index.css` — the `.font-display` rule, if the new face has no
   variable axes, delete the `font-variation-settings` line

---

## 10. Swapping the photo

Export two files into `public/`, both square:

| File | Format | Size | Quality |
| --- | --- | --- | --- |
| `humayun.webp` | WebP | 800 × 800 | ~82 |
| `humayun.jpg` | JPEG | 800 × 800 | ~84, progressive |

Frame it so your head sits in the upper third. The site desaturates and tints
the image to match the palette, so a plain background works best.

If you rename the files, update `profile.photo` in `src/data/profile.js`.

---

## 11. Updating the resume PDF

Replace `public/resume.pdf`. The download button picks it up with no code
change. Keep the filename.

---

## 12. Turning on the contact form

The form already works: with no account configured it opens the visitor's
email client with the message pre-filled. To collect submissions in your inbox
instead:

1. Sign up free at https://formspree.io
2. Create a form, copy the ID from the endpoint (`https://formspree.io/f/**xayzbwqd**`)
3. Put it in `src/config/site.js`:

```js
contactForm: { provider: 'formspree', formId: 'xayzbwqd' },
```

Free tier covers 50 submissions a month.

## Recruiter features

- **Role lens** (`src/data/roles.js`): the "I am hiring for" buttons in the hero. Each role has a pitch, three `lookFirst` project ids and a resume PDF. Tag a project with `roles: ['ml', 'sde', ...]` in `src/data/projects.js` so it ranks for that role. A role-specific link such as `?role=embedded` opens the site with that lens already selected, which is what to put in an application for that kind of job.
- **Overview grid and sticky bar**: generated from the same project data; nothing to maintain separately.
- **Skills evidence** (`src/lib/skillMatch.js`): a skill links to a project when the project's `tech` list names it, or when it is listed in `EXPLICIT` there.
- **Share pages**: `npm run build` writes `dist/p/<project-id>/index.html` for every project, so a shared link shows that project's own preview card. Preview images live in `public/og/` (1200x630, one per project). Regenerate one when a project's title, tagline or first metrics change.
- **Analytics** (`site.analytics.goatcounter`): off until a GoatCounter site code is set. No cookies, so no consent banner is needed.
- **Resumes**: LaTeX sources are in `resume/`; see `resume/README.md`.
