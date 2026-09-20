import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell } from './SimShell'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from '../../lib/cn'

// ===========================================================================
//  SDN DDoS CONTROL LOOP — interactive topology
//
//  A running model of the three-host Mininet topology: packets travel host ->
//  switch -> server, the controller polls per-host packet rate, the classifier
//  labels each host, and a DROP rule installed in the flow table stops the
//  attacker's packets at the switch. The two throughput endpoints are the
//  measured values from the project; see the note under the demo.
// ===========================================================================

const CLEAN_GBPS = 54.3
const FLOODED_GBPS = 31.0
const BASE_LATENCY = 0.08 // ms, measured clean

// Layout in SVG user units. Kept fixed so the diagram scrolls rather than
// shrinking below readable size on a phone.
const W = 760
const H = 300
const SWITCH = { x: 360, y: 170 }
const SERVER = { x: 620, y: 170 }
const CONTROLLER = { x: 360, y: 42 }

const HOSTS = [
  { id: 'h1', label: 'h1', kind: 'normal', y: 70 },
  { id: 'h2', label: 'h2', kind: 'normal', y: 170 },
  { id: 'h3', label: 'h3', kind: 'attacker', y: 270 },
]
const HOST_X = 90

// Packets per polling window. Normal hosts sit well under the classifier's
// learned boundary; the attacker crosses it immediately once the flood starts.
const NORMAL_RATE = [18, 24]
const ATTACK_RATE = [780, 950]

const rand = (lo, hi) => lo + Math.random() * (hi - lo)

export function DdosPipelineSim() {
  const reduced = useReducedMotion()
  const [running, setRunning] = useState(false)
  const [attacking, setAttacking] = useState(false)
  const [detectorOn, setDetectorOn] = useState(true)
  const [blocked, setBlocked] = useState(false)
  const [droppedCount, setDroppedCount] = useState(0)
  const [rates, setRates] = useState({ h1: 0, h2: 0, h3: 0 })
  const [pollTick, setPollTick] = useState(0)

  const packets = useRef([])
  const frame = useRef(null)
  const [, forceRender] = useState(0)

  const reset = useCallback(() => {
    setRunning(false)
    setAttacking(false)
    setDetectorOn(true)
    setBlocked(false)
    setDroppedCount(0)
    setRates({ h1: 0, h2: 0, h3: 0 })
    packets.current = []
    forceRender((n) => n + 1)
  }, [])

  // ---- Controller polling loop: samples per-host rate every 2 seconds,
  // which is the detection window used in the project. -------------------
  useEffect(() => {
    if (!running) return
    const poll = () => {
      const next = {
        h1: Math.round(rand(...NORMAL_RATE)),
        h2: Math.round(rand(...NORMAL_RATE)),
        h3: attacking ? Math.round(rand(...ATTACK_RATE)) : Math.round(rand(...NORMAL_RATE)),
      }
      setRates(next)
      setPollTick((t) => t + 1)
      // The classifier only acts when it is enabled; with it off the flood
      // runs unmitigated, which is the comparison the project is making.
      if (detectorOn && attacking) setBlocked(true)
      if (!attacking) setBlocked(false)
    }
    poll()
    const id = setInterval(poll, 2000)
    return () => clearInterval(id)
  }, [running, attacking, detectorOn])

  // ---- Packet animation -------------------------------------------------
  useEffect(() => {
    if (!running || reduced) return
    let last = performance.now()
    let spawnAcc = 0

    const tick = (now) => {
      const dt = Math.min(64, now - last)
      last = now
      spawnAcc += dt

      // Spawn on a fixed cadence; attacker emits far more packets per window.
      if (spawnAcc > 90) {
        spawnAcc = 0
        HOSTS.forEach((host) => {
          const isAttacker = host.kind === 'attacker'
          const count = isAttacker && attacking ? 3 : 1
          for (let i = 0; i < count; i += 1) {
            if (!isAttacker || attacking || Math.random() > 0.4) {
              packets.current.push({
                id: Math.random(),
                host: host.id,
                y: host.y,
                t: 0,
                attack: isAttacker && attacking,
              })
            }
          }
        })
      }

      const speed = dt / 1400
      let newlyDropped = 0
      packets.current = packets.current.filter((p) => {
        p.t += speed
        // A dropped packet dies at the switch instead of reaching the server.
        if (p.attack && blocked && p.t >= 0.5) {
          newlyDropped += 1
          return false
        }
        return p.t < 1
      })
      if (newlyDropped) setDroppedCount((c) => c + newlyDropped)

      forceRender((n) => n + 1)
      frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [running, attacking, blocked, reduced])

  // ---- Derived readouts -------------------------------------------------
  const underAttack = attacking && !blocked
  const throughput = underAttack ? FLOODED_GBPS + rand(-0.4, 0.4) : CLEAN_GBPS - rand(0, 0.5)
  const latency = underAttack ? BASE_LATENCY * rand(9, 13) : BASE_LATENCY * rand(1, 1.15)

  const verdict = (hostId) => {
    if (!detectorOn) return 'not evaluated'
    if (rates[hostId] > 400) return 'attack'
    return 'normal'
  }

  const status = !running
    ? 'Idle. Start the topology to bring the hosts online.'
    : blocked
      ? 'Classifier labelled h3 as attack traffic. DROP rule installed — its packets die at the switch and never reach the server.'
      : attacking
        ? detectorOn
          ? 'Flood detected, waiting for the next polling window.'
          : 'Flood in progress with the classifier disabled. Nothing is stopping it.'
        : 'Normal traffic. All three hosts are below the classifier boundary.'

  return (
    <SimShell
      title="Three-host topology under an ICMP flood"
      onReset={reset}
      note="Clean and flooded throughput (54.3 and 31 Gbps) and the clean baseline latency (0.08 ms) are measured values from the project, as is the 2-second controller polling window. Per-packet animation and per-host counters are a model of the same behaviour, not a capture."
      controls={
        <div className="flex flex-wrap items-center gap-2">
          <Ctl active={running} onClick={() => setRunning((v) => !v)}>
            {running ? 'Stop topology' : 'Start topology'}
          </Ctl>
          <Ctl
            active={attacking}
            danger
            disabled={!running}
            onClick={() => setAttacking((v) => !v)}
          >
            {attacking ? 'Stop flood' : 'Launch flood from h3'}
          </Ctl>
          <label className="ml-auto flex items-center gap-2 text-micro text-muted">
            <input
              type="checkbox"
              checked={detectorOn}
              onChange={(e) => setDetectorOn(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--c-accent)]"
            />
            Random Forest classifier on the controller
          </label>
        </div>
      }
    >
      <div className="relative -mx-4">
        <div className="overflow-x-auto px-4 pb-1" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div style={{ minWidth: W }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
               aria-label="Three hosts connected to an OpenFlow switch and a server, with a controller above the switch">
            {/* links */}
            {HOSTS.map((h) => (
              <line
                key={h.id}
                x1={HOST_X + 46}
                y1={h.y}
                x2={SWITCH.x - 46}
                y2={SWITCH.y}
                stroke="var(--c-grey-200)"
                strokeWidth="1.5"
              />
            ))}
            <line x1={SWITCH.x + 46} y1={SWITCH.y} x2={SERVER.x - 40} y2={SERVER.y}
                  stroke="var(--c-grey-200)" strokeWidth="1.5" />
            <line x1={SWITCH.x} y1={SWITCH.y - 34} x2={CONTROLLER.x} y2={CONTROLLER.y + 20}
                  stroke="var(--c-grey-500)" strokeWidth="1" strokeDasharray="4 4" opacity="0.7" />
            <text x={SWITCH.x + 8} y={SWITCH.y - 46} fill="var(--c-grey-500)" fontSize="10.5"
                  fontFamily="Inter, system-ui, sans-serif">
              OpenFlow channel
            </text>

            {/* packets in flight */}
            {packets.current.map((p) => {
              const start = { x: HOST_X + 46, y: p.y }
              const mid = { x: SWITCH.x, y: SWITCH.y }
              const end = { x: SERVER.x - 40, y: SERVER.y }
              const pos =
                p.t < 0.5
                  ? {
                      x: start.x + (mid.x - start.x) * (p.t / 0.5),
                      y: start.y + (mid.y - start.y) * (p.t / 0.5),
                    }
                  : {
                      x: mid.x + (end.x - mid.x) * ((p.t - 0.5) / 0.5),
                      y: mid.y + (end.y - mid.y) * ((p.t - 0.5) / 0.5),
                    }
              return (
                <circle
                  key={p.id}
                  cx={pos.x}
                  cy={pos.y}
                  r={p.attack ? 3.4 : 2.6}
                  fill={p.attack ? '#c2542f' : 'var(--c-accent)'}
                  opacity={p.attack ? 0.9 : 0.65}
                />
              )
            })}

            {/* hosts */}
            {HOSTS.map((h) => {
              const isAttacker = h.kind === 'attacker'
              const flagged = detectorOn && running && rates[h.id] > 400
              return (
                <g key={h.id}>
                  <rect
                    x={HOST_X - 46}
                    y={h.y - 20}
                    width="92"
                    height="40"
                    rx="2"
                    fill="var(--c-surface)"
                    stroke={flagged ? '#c2542f' : 'var(--c-grey-200)'}
                    strokeWidth={flagged ? 1.6 : 1}
                  />
                  <text x={HOST_X} y={h.y - 3} textAnchor="middle" fill="var(--c-fg)"
                        fontSize="12.5" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">
                    {h.label}
                    {isAttacker ? ' (attacker)' : ''}
                  </text>
                  <text x={HOST_X} y={h.y + 12} textAnchor="middle"
                        fill={flagged ? '#c2542f' : 'var(--c-grey-500)'} fontSize="10.5"
                        fontFamily="Inter, system-ui, sans-serif">
                    {running ? `${rates[h.id]} pkt/s` : 'offline'}
                  </text>
                </g>
              )
            })}

            {/* switch */}
            <rect x={SWITCH.x - 46} y={SWITCH.y - 24} width="92" height="48" rx="2"
                  fill="var(--c-surface)" stroke={blocked ? 'var(--c-accent)' : 'var(--c-grey-200)'}
                  strokeWidth={blocked ? 1.6 : 1} />
            <text x={SWITCH.x} y={SWITCH.y - 4} textAnchor="middle" fill="var(--c-fg)" fontSize="12.5"
                  fontFamily="Inter, system-ui, sans-serif" fontWeight="500">
              s1
            </text>
            <text x={SWITCH.x} y={SWITCH.y + 12} textAnchor="middle" fill="var(--c-grey-500)"
                  fontSize="10.5" fontFamily="Inter, system-ui, sans-serif">
              OpenFlow switch
            </text>

            {/* controller */}
            <rect x={CONTROLLER.x - 70} y={CONTROLLER.y - 20} width="140" height="40" rx="2"
                  fill="var(--c-surface)" stroke="var(--c-grey-200)" />
            <text x={CONTROLLER.x} y={CONTROLLER.y - 2} textAnchor="middle" fill="var(--c-fg)"
                  fontSize="12.5" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">
              POX controller
            </text>
            <text x={CONTROLLER.x} y={CONTROLLER.y + 12} textAnchor="middle"
                  fill={detectorOn ? 'var(--c-accent)' : 'var(--c-grey-500)'} fontSize="10.5"
                  fontFamily="Inter, system-ui, sans-serif">
              {detectorOn ? `polling · window ${pollTick}` : 'classifier disabled'}
            </text>

            {/* server */}
            <rect x={SERVER.x - 40} y={SERVER.y - 24} width="110" height="48" rx="2"
                  fill="var(--c-surface)" stroke="var(--c-grey-200)" />
            <text x={SERVER.x + 15} y={SERVER.y - 4} textAnchor="middle" fill="var(--c-fg)"
                  fontSize="12.5" fontFamily="Inter, system-ui, sans-serif" fontWeight="500">
              victim
            </text>
            <text x={SERVER.x + 15} y={SERVER.y + 12} textAnchor="middle" fill="var(--c-grey-500)"
                  fontSize="10.5" fontFamily="Inter, system-ui, sans-serif">
              iperf server
            </text>
          </svg>
        </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-bg to-transparent sm:hidden"
        />
      </div>

      {/* Live readouts */}
      <div className="mt-6 grid gap-5 sm:grid-cols-4">
        <Readout label="Throughput" value={running ? throughput.toFixed(1) : '—'} unit="Gbps"
                 bad={running && underAttack} />
        <Readout label="Latency" value={running ? latency.toFixed(2) : '—'} unit="ms avg"
                 bad={running && underAttack} />
        <Readout label="Packets dropped" value={droppedCount.toLocaleString()} unit="at the switch" />
        <Readout label="Flow table" value={blocked ? '2 rules' : '1 rule'}
                 unit={blocked ? 'forward + drop h3' : 'forward all'} />
      </div>

      {/* Flow table, so the mitigation is a visible artefact rather than a claim */}
      <div className="mt-5 border border-line">
        <p className="border-b border-line px-3 py-2 text-micro text-muted">
          s1 flow table
        </p>
        <div className="divide-y divide-[color:var(--c-grey-200)] font-mono text-micro">
          <p className="px-3 py-2">
            priority=1 · in_port=* · actions=NORMAL
          </p>
          {blocked && (
            <p className="px-3 py-2 text-[#c2542f]">
              priority=100 · nw_src=10.0.0.3 · actions=DROP
            </p>
          )}
        </div>
      </div>

      <p className={cn('mt-5 text-small', underAttack ? 'text-[#c2542f]' : 'text-muted')}>
        {status}
      </p>
    </SimShell>
  )
}

function Ctl({ children, active, danger, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'border px-3 py-1.5 text-micro transition-colors',
        disabled && 'cursor-not-allowed opacity-40',
        active && danger && 'border-[#c2542f] bg-[#c2542f] text-bg',
        active && !danger && 'border-accent bg-accent text-bg',
        !active && 'border-line text-muted hover:border-accent hover:text-accent',
      )}
    >
      {children}
    </button>
  )
}

function Readout({ label, value, unit, bad }) {
  return (
    <div>
      <p className="text-micro text-muted">{label}</p>
      <p className={cn('nums font-display text-h4 font-semibold leading-none', bad ? 'text-[#c2542f]' : 'text-fg')}>
        {value}
      </p>
      <p className="mt-1 text-micro text-muted">{unit}</p>
    </div>
  )
}
