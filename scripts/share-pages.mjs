// Runs after `vite build`. GitHub Pages serves one static page, and link
// previews (LinkedIn, WhatsApp, Slack) ignore the #fragment, so every shared
// project link would show the same generic card. This writes one tiny page per
// project at /p/<id>/ with that project's own title, description and image, which
// then forwards the visitor to the real section of the site.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { projects } from '../src/data/projects.js'
import { site } from '../src/config/site.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const base = site.url.replace(/\/$/, '')
let written = 0

for (const p of projects) {
  const dir = `dist/p/${p.id}`
  mkdirSync(dir, { recursive: true })
  const pageUrl = `${base}/p/${p.id}/`
  const target = `${base}/#${p.id}`
  const image = existsSync(`public/og/${p.id}.png`) ? `${base}/og/${p.id}.png` : `${base}/og-image.png`
  const title = `${p.title} | MD Humayun`
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(p.tagline)}" />
<link rel="canonical" href="${pageUrl}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="MD Humayun" />
<meta property="og:title" content="${esc(p.title)}" />
<meta property="og:description" content="${esc(p.tagline)}" />
<meta property="og:url" content="${pageUrl}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.title)}" />
<meta name="twitter:description" content="${esc(p.tagline)}" />
<meta name="twitter:image" content="${image}" />
<meta http-equiv="refresh" content="0;url=${target}" />
<script>location.replace(${JSON.stringify(target)})</script>
</head>
<body>
<p><a href="${target}">Open ${esc(p.title)} on the portfolio</a></p>
</body>
</html>
`
  writeFileSync(`${dir}/index.html`, html)
  written += 1
}
console.log(`share pages: wrote ${written} to dist/p/`)
