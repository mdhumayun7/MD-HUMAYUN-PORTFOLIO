import { motion } from 'framer-motion'

// ===========================================================================
//  SHARED SVG DIAGRAM PARTS
//  Colours come from `currentColor` and CSS variables, so every diagram
//  re-themes automatically in dark mode with no duplicated markup.
// ===========================================================================

export const NODE_W = 168
export const NODE_H = 60

/** Arrowhead marker. Each diagram needs its own id to avoid collisions. */
export function ArrowMarker({ id }) {
  return (
    <defs>
      <marker
        id={id}
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="6"
        markerHeight="6"
        orient="auto-start-reverse"
      >
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--c-grey-500)" />
      </marker>
    </defs>
  )
}

/** A labelled box. `note` is the small second line. */
export function Node({ x, y, label, note, accent = false, delay = 0, animate = true }) {
  const body = (
    <g>
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx="2"
        fill="var(--c-surface)"
        stroke={accent ? 'var(--c-accent)' : 'var(--c-grey-200)'}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + NODE_W / 2}
        y={note ? y + 26 : y + 34}
        textAnchor="middle"
        fill="var(--c-fg)"
        fontSize="14"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="500"
      >
        {label}
      </text>
      {note && (
        <text
          x={x + NODE_W / 2}
          y={y + 44}
          textAnchor="middle"
          fill="var(--c-grey-500)"
          fontSize="11.5"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {note}
        </text>
      )}
    </g>
  )

  if (!animate) return body

  return (
    <motion.g
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {body}
    </motion.g>
  )
}

/** A connector between two points. Draws itself in when scrolled into view. */
export function Edge({ d, markerId, label, labelPos, delay = 0, animate = true, dashed = false }) {
  const stroke = (
    <path
      d={d}
      fill="none"
      stroke="var(--c-grey-500)"
      strokeWidth="1"
      strokeDasharray={dashed ? '4 4' : undefined}
      markerEnd={`url(#${markerId})`}
      opacity="0.75"
    />
  )

  return (
    <g>
      {animate ? (
        <motion.path
          d={d}
          fill="none"
          stroke="var(--c-grey-500)"
          strokeWidth="1"
          strokeDasharray={dashed ? '4 4' : undefined}
          markerEnd={`url(#${markerId})`}
          opacity="0.75"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        />
      ) : (
        stroke
      )}
      {label && labelPos && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          fill="var(--c-grey-500)"
          fontSize="11"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {label}
        </text>
      )}
    </g>
  )
}

/** Column heading above a lane of nodes. */
export function LaneLabel({ x, y, children }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="var(--c-grey-500)"
      fontSize="11.5"
      fontFamily="Inter, system-ui, sans-serif"
      letterSpacing="0.04em"
    >
      {children}
    </text>
  )
}

/**
 * Horizontal scroll container. Diagrams keep a fixed minimum width so text
 * never shrinks below readable size; on a phone or tablet the diagram
 * scrolls sideways rather than becoming illegible.
 *
 * The right-edge fade is a static hint that there is more to scroll to --
 * cheap to render (pure CSS, no scroll-position JS) and disappears on
 * screens wide enough that the diagram already fits.
 */
export function DiagramScroller({ minWidth, children }) {
  return (
    <div className="relative -mx-5 sm:mx-0">
      <div className="overflow-x-auto px-5 pb-1 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth }}>{children}</div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
      />
    </div>
  )
}
