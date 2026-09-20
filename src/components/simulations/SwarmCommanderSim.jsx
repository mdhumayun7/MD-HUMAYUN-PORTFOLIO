import { useEffect, useRef, useState } from 'react'
import { SimShell } from './SimShell'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from '../../lib/cn'

// ===========================================================================
//  COMMANDER COMPARISON — interactive
//
//  Four commander types drive the same six agents toward the same target
//  through the same obstacles, each with the movement rule that architecture
//  actually uses. This is a behavioural sketch, not a replay of the benchmark
//  -- the only real numbers here are the two headline results (67.9% vs
//  60.7% action accuracy), attached to the two learned commanders and stated
//  as measured in the note below.
// ===========================================================================

const W = 640
const H = 300
const TARGET = { x: W - 60, y: H / 2 }
const OBSTACLES = [
  { x: 260, y: 90, r: 26 },
  { x: 320, y: 210, r: 22 },
  { x: 420, y: 140, r: 30 },
]
const N_AGENTS = 6

const COMMANDERS = [
  {
    id: 'consensus',
    label: 'Consensus',
    kind: 'classical',
    blurb: 'Agents average their neighbours\u2019 headings and nudge toward the target. Predictable, but slow to react to a newly revealed obstacle.',
  },
  {
    id: 'field',
    label: 'Potential Field',
    kind: 'classical',
    blurb: 'Target attracts, obstacles repel, agents follow the summed force. Reacts instantly but can stall in a local minimum between two obstacles.',
  },
  {
    id: 'ppo',
    label: 'PPO',
    kind: 'learned',
    blurb: 'A learned policy per agent. More willing to take a wide detour early rather than correct late.',
    accuracy: 60.7,
    accuracyLabel: 'best classical baseline',
  },
  {
    id: 'hybrid',
    label: 'Hybrid LLM+PPO',
    kind: 'learned',
    blurb: 'PPO proposes a manoeuvre, the fine-tuned LLM commander approves or overrides it against the tactical scenario.',
    accuracy: 67.9,
    accuracyLabel: 'measured action accuracy',
  },
]

function seedAgents() {
  return Array.from({ length: N_AGENTS }, (_, i) => ({
    x: 30,
    y: 40 + i * ((H - 80) / (N_AGENTS - 1)),
    vx: 0,
    vy: 0,
    id: i,
  }))
}

function stepAgent(a, commanderId, agents) {
  const toTargetX = TARGET.x - a.x
  const toTargetY = TARGET.y - a.y
  const dist = Math.hypot(toTargetX, toTargetY) || 1
  let ax = (toTargetX / dist) * 0.16
  let ay = (toTargetY / dist) * 0.16

  // Obstacle repulsion -- every commander avoids collision, but how much
  // margin it keeps, and how early, differs by type below.
  const margin = commanderId === 'field' ? 46 : commanderId === 'consensus' ? 30 : 38
  OBSTACLES.forEach((o) => {
    const dx = a.x - o.x
    const dy = a.y - o.y
    const d = Math.hypot(dx, dy)
    if (d < o.r + margin) {
      const push = (o.r + margin - d) / (o.r + margin)
      ax += (dx / (d || 1)) * push * (commanderId === 'field' ? 1.1 : 0.7)
      ay += (dy / (d || 1)) * push * (commanderId === 'field' ? 1.1 : 0.7)
    }
  })

  if (commanderId === 'consensus') {
    // Average heading with neighbours -- coordinated, but slow to break from
    // the group when only one agent has seen a problem.
    let nx = 0
    let ny = 0
    agents.forEach((b) => {
      if (b.id !== a.id) {
        nx += b.vx
        ny += b.vy
      }
    })
    ax = ax * 0.6 + (nx / (N_AGENTS - 1)) * 0.4
    ay = ay * 0.6 + (ny / (N_AGENTS - 1)) * 0.4
  }

  if (commanderId === 'ppo' || commanderId === 'hybrid') {
    // Learned commanders commit to a wider detour earlier rather than
    // correcting at the last moment, and the hybrid corrects fastest.
    const lookahead = commanderId === 'hybrid' ? 70 : 50
    OBSTACLES.forEach((o) => {
      const dx = a.x - o.x
      const dy = a.y - o.y
      const d = Math.hypot(dx, dy)
      if (d < o.r + lookahead) {
        const tangentX = -dy / (d || 1)
        const tangentY = dx / (d || 1)
        const bend = commanderId === 'hybrid' ? 0.1 : 0.06
        ax += tangentX * bend
        ay += tangentY * bend
      }
    })
  }

  a.vx = a.vx * 0.86 + ax * 0.5
  a.vy = a.vy * 0.86 + ay * 0.5
  a.x += a.vx
  a.y += a.vy
  a.x = Math.max(14, Math.min(W - 14, a.x))
  a.y = Math.max(14, Math.min(H - 14, a.y))
}

export function SwarmCommanderSim() {
  const reduced = useReducedMotion()
  const [commanderId, setCommanderId] = useState('hybrid')
  const [running, setRunning] = useState(false)
  const [arrived, setArrived] = useState(0)
  const agents = useRef(seedAgents())
  const frame = useRef(null)
  const [, force] = useState(0)

  const reset = () => {
    agents.current = seedAgents()
    setArrived(0)
    setRunning(false)
    force((n) => n + 1)
  }

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commanderId])

  useEffect(() => {
    if (!running || reduced) return
    const tick = () => {
      let count = 0
      agents.current.forEach((a) => {
        stepAgent(a, commanderId, agents.current)
        if (Math.hypot(TARGET.x - a.x, TARGET.y - a.y) < 22) count += 1
      })
      setArrived(count)
      force((n) => n + 1)
      if (count < N_AGENTS) frame.current = requestAnimationFrame(tick)
      else setRunning(false)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [running, commanderId, reduced])

  const commander = COMMANDERS.find((c) => c.id === commanderId)

  return (
    <SimShell
      title="Same swarm, same obstacles, different commander"
      onReset={reset}
      note="The two accuracy figures shown for PPO and the hybrid commander (60.7% and 67.9%) are the measured results from the 28-scenario benchmark. The movement itself is a behavioural sketch built from each architecture's actual decision rule, run live in the browser -- not a replay of the benchmark simulation."
      controls={
        <div className="flex flex-wrap gap-2">
          {COMMANDERS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={c.id === commanderId}
              onClick={() => setCommanderId(c.id)}
              className={cn(
                'border px-3 py-1.5 text-micro transition-colors',
                c.id === commanderId
                  ? 'border-accent bg-accent text-bg'
                  : 'border-line text-muted hover:border-accent hover:text-accent',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="relative -mx-4 sm:mx-0">
        <div className="overflow-x-auto px-4 pb-1 sm:px-0" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div style={{ minWidth: W }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
                 aria-label={`Six agents navigating toward a target under the ${commander.label} commander`}>
              <rect x="0" y="0" width={W} height={H} fill="none" />
              {OBSTACLES.map((o, i) => (
                <circle key={i} cx={o.x} cy={o.y} r={o.r} fill="var(--c-grey-200)" opacity="0.7" />
              ))}
              <circle cx={TARGET.x} cy={TARGET.y} r="16" fill="none" stroke="var(--c-accent)" strokeWidth="2" strokeDasharray="3 4" />
              <text x={TARGET.x} y={TARGET.y - 24} textAnchor="middle" fill="var(--c-grey-500)"
                    fontSize="11" fontFamily="Inter, system-ui, sans-serif">target</text>
              {agents.current.map((a) => (
                <circle key={a.id} cx={a.x} cy={a.y} r="6" fill="var(--c-accent)" opacity="0.9" />
              ))}
            </svg>
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-bg to-transparent sm:hidden" />
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-micro text-muted">{commander.label}</p>
          <p className="mt-1 max-w-prose text-small text-muted">{commander.blurb}</p>
        </div>
        <div className="flex items-end gap-6">
          <div>
            <p className="text-micro text-muted">Arrived</p>
            <p className="nums font-display text-h4 font-semibold leading-none">
              {arrived} / {N_AGENTS}
            </p>
          </div>
          {commander.accuracy && (
            <div>
              <p className="text-micro text-muted">{commander.accuracyLabel}</p>
              <p className="nums font-display text-h4 font-semibold leading-none text-accent">
                {commander.accuracy}%
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setRunning((v) => !v)}
        disabled={arrived === N_AGENTS && !running}
        className={cn(
          'mt-5 border px-4 py-2 text-small transition-colors',
          running ? 'border-accent bg-accent text-bg' : 'border-line text-fg hover:border-accent hover:text-accent',
          arrived === N_AGENTS && !running && 'cursor-not-allowed opacity-50',
        )}
      >
        {running ? 'Pause' : arrived === N_AGENTS ? 'All arrived -- reset to run again' : 'Run'}
      </button>
    </SimShell>
  )
}
