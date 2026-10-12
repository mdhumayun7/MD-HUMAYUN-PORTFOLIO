/**
 * The guide's face: a small rounded chip with an antenna and two eyes. Drawn
 * from scratch to match the site's flat, technical look. The pupils read
 * --lx / --ly (-1 to 1) set by the Guide, so they glance where the cursor moves.
 */
export function GuideAvatar({ size = 32 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden focusable="false">
      <line x1="16" y1="8" x2="16" y2="3.5" stroke="var(--c-accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="2.8" r="1.8" fill="var(--c-accent)" />
      <rect x="3.5" y="8" width="25" height="19" rx="5.5" fill="var(--c-accent)" />
      <circle cx="11.5" cy="16.5" r="3.7" fill="var(--c-bg)" />
      <circle cx="20.5" cy="16.5" r="3.7" fill="var(--c-bg)" />
      <g style={{ transform: 'translate(calc(var(--lx, 0) * 1.6px), calc(var(--ly, 0) * 1.6px))' }}>
        <circle cx="11.5" cy="16.5" r="1.6" fill="var(--c-fg)" />
        <circle cx="20.5" cy="16.5" r="1.6" fill="var(--c-fg)" />
      </g>
      <line x1="12.5" y1="22.6" x2="19.5" y2="22.6" stroke="var(--c-bg)" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" />
    </svg>
  )
}
