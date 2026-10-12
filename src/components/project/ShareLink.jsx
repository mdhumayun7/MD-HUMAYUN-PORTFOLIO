import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { site } from '../../config/site'
import { track } from '../../lib/analytics'

/**
 * Copies a link to this one project. The link points at /p/<id>/, a tiny page
 * generated at build time so the preview card on LinkedIn or WhatsApp shows
 * this project's own title and image, then forwards to the section.
 */
export function ShareLink({ projectId }) {
  const [copied, setCopied] = useState(false)
  const url = `${site.url.replace(/\/$/, '')}/p/${projectId}/`

  const copy = async () => {
    track(`share-${projectId}`)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt('Copy this link', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 border-b border-transparent pb-px text-small
                 transition-colors hover:border-accent hover:text-accent"
    >
      <Link2 size={14} aria-hidden />
      {copied ? 'Link copied' : 'Copy link to this project'}
    </button>
  )
}
