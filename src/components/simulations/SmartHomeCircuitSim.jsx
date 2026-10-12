import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell } from './SimShell'
import {
  TICK_MS,
  advance,
  createSim,
  oledLine,
  outputs,
  pressButton,
  raiseMotion,
  toggleDoor,
} from './AlarmStateMachineSim'
import { cn } from '../../lib/cn'

// ===========================================================================
//  WOKWI-STYLE CIRCUIT — interactive
//  The parts and wiring mirror wokwi/diagram.json in the Smart-Home-Automation
//  repository: ESP32 DevKit, PIR sensor, slide switch (door), blue ARM button,
//  SSD1306 OLED, buzzer, and green / red LEDs with 220 ohm resistors. Wire
//  colours follow that file. Behaviour is the same port of the firmware state
//  machine used in the demo below it, driven by a simulated clock.
// ===========================================================================

const WIRE = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  orange: '#f97316',
  yellow: '#eab308',
  white: '#e5e7eb',
  purple: '#a855f7',
  black: '#6b7280',
}

const ESP = { x: 250, y: 70, w: 140, h: 290 }
const GND_L = 235 // left ground bus
const GND_R = 430 // right ground bus
const GND_Y = 335

function Wire({ d, color, active = false }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={WIRE[color]}
      strokeWidth={active ? 3 : 2}
      strokeLinecap="round"
      opacity={active ? 1 : 0.55}
    />
  )
}

function Pin({ x, y, label, side }) {
  const left = side === 'left'
  return (
    <g>
      <circle cx={x} cy={y} r="3" fill="#d4d4d8" />
      <text
        x={left ? x + 8 : x - 8}
        y={y + 3}
        textAnchor={left ? 'start' : 'end'}
        fontSize="8"
        fill="#d4d4d8"
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  )
}

function Part({ onActivate, label, children, pressed }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={pressed}
      style={{ cursor: 'pointer', outline: 'none' }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      {children}
    </g>
  )
}

export function SmartHomeCircuitSim() {
  const simRef = useRef(createSim())
  const holdRef = useRef(false)
  const [, bump] = useState(0)
  const [speed, setSpeed] = useState(1)
  const rerender = useCallback(() => bump((n) => n + 1), [])

  useEffect(() => {
    const id = setInterval(() => {
      const s = simRef.current
      if (holdRef.current) raiseMotion(s) // PIR held high: only the rising edge triggers
      advance(s, TICK_MS * speed)
      rerender()
    }, TICK_MS)
    return () => clearInterval(id)
  }, [speed, rerender])

  const reset = () => {
    holdRef.current = false
    simRef.current = createSim()
    rerender()
  }

  const s = simRef.current
  const out = outputs(s)
  const pirHigh = s.pirRaised
  const oled = oledLine(s)

  const L = ESP.x
  const R = ESP.x + ESP.w
  const pinsL = { VIN: 105, D13: 135, D14: 165, D27: 195 }
  const pinsR = { '3V3': 105, D21: 135, D22: 165, D23: 205, D26: 245, D25: 285 }

  return (
    <SimShell
      title="Circuit, as in the Wokwi project: click the parts"
      onReset={reset}
      note="Parts and wiring follow wokwi/diagram.json in the repository, and wire colours match that file. This is not the Wokwi runtime and it does not execute the compiled firmware: behaviour is a JavaScript port of the firmware's state machine on a simulated clock. PIR warm-up and confirmation, debounce, Wi-Fi and MQTT are not modelled."
      controls={
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-small">
          <span className="text-muted">
            Click the PIR to hold motion on or off, the slide switch to open or close the door, and the blue
            button to arm or disarm.
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="text-muted">Clock speed</span>
            {[1, 4].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setSpeed(v)}
                aria-pressed={speed === v}
                className={cn(
                  'border px-2 py-0.5 text-micro transition-colors',
                  speed === v ? 'border-accent text-accent' : 'border-line text-muted hover:border-accent',
                )}
              >
                {v}x
              </button>
            ))}
          </span>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 640 390"
          className="mx-auto block w-full min-w-[560px] max-w-[760px]"
          role="group"
          aria-label="Interactive circuit of the smart home alarm"
        >
          {/* ---------------- wires (drawn first, parts sit on top) ---------------- */}
          {/* PIR */}
          <Wire color="red" d={`M 150 55 C 200 55, 200 ${pinsL.VIN}, ${L} ${pinsL.VIN}`} />
          <Wire color="green" active={pirHigh} d={`M 150 80 C 200 80, 200 ${pinsL.D13}, ${L} ${pinsL.D13}`} />
          <Wire color="black" d={`M 150 105 H ${GND_L - 10} V ${GND_Y} H ${L}`} />
          {/* door slide switch */}
          <Wire color="orange" active={s.door} d={`M 150 180 C 200 180, 200 ${pinsL.D14}, ${L} ${pinsL.D14}`} />
          <Wire color="black" d={`M 150 200 H ${GND_L} V ${GND_Y} H ${L}`} />
          {/* ARM button */}
          <Wire color="blue" d={`M 150 262 C 200 262, 200 ${pinsL.D27}, ${L} ${pinsL.D27}`} />
          <Wire color="black" d={`M 150 285 H ${GND_L + 10} V ${GND_Y} H ${L}`} />
          {/* OLED */}
          <Wire color="red" d={`M 480 45 C 440 45, 440 ${pinsR['3V3']}, ${R} ${pinsR['3V3']}`} />
          <Wire color="white" d={`M 480 65 C 440 65, 440 ${pinsR.D21}, ${R} ${pinsR.D21}`} />
          <Wire color="yellow" d={`M 480 85 C 440 85, 440 ${pinsR.D22}, ${R} ${pinsR.D22}`} />
          <Wire color="black" d={`M 480 105 H ${GND_R + 10} V ${GND_Y} H ${R}`} />
          {/* buzzer */}
          <Wire color="purple" active={out.buzz} d={`M 480 190 C 440 190, 440 ${pinsR.D23}, ${R} ${pinsR.D23}`} />
          <Wire color="black" d={`M 480 208 H ${GND_R} V ${GND_Y} H ${R}`} />
          {/* green LED + 220 ohm */}
          <Wire color="green" active={out.green} d={`M ${R} ${pinsR.D26} C 430 ${pinsR.D26}, 440 252, 480 252`} />
          <Wire color="black" d={`M 480 270 H ${GND_R - 8} V ${GND_Y} H ${R}`} />
          {/* red LED + 220 ohm */}
          <Wire color="red" active={out.red} d={`M ${R} ${pinsR.D25} C 430 ${pinsR.D25}, 440 312, 480 312`} />
          <Wire color="black" d={`M 480 330 H ${GND_R + 6} V ${GND_Y} H ${R}`} />

          {/* ---------------- ESP32 ---------------- */}
          <rect x={ESP.x} y={ESP.y} width={ESP.w} height={ESP.h} rx="8" fill="#1f2937" stroke="#4b5563" />
          <rect x={ESP.x + 40} y={ESP.y + 8} width="60" height="46" rx="3" fill="#374151" />
          <text x={ESP.x + ESP.w / 2} y={ESP.y + 36} textAnchor="middle" fontSize="9" fill="#d4d4d8" fontFamily="monospace">
            ESP32
          </text>
          {Object.entries(pinsL).map(([k, y]) => (
            <Pin key={k} x={L} y={y} label={k} side="left" />
          ))}
          {Object.entries(pinsR).map(([k, y]) => (
            <Pin key={k} x={R} y={y} label={k} side="right" />
          ))}
          <Pin x={L} y={GND_Y} label="GND.2" side="left" />
          <Pin x={R} y={GND_Y} label="GND.1" side="right" />

          {/* ---------------- PIR ---------------- */}
          <Part
            label={pirHigh ? 'PIR sensor, motion detected. Click to clear' : 'PIR sensor, idle. Click to hold motion'}
            pressed={holdRef.current}
            onActivate={() => {
              holdRef.current = !holdRef.current
              if (!holdRef.current) simRef.current.pirUntil = simRef.current.now
              rerender()
            }}
          >
            <rect x="40" y="30" width="110" height="95" rx="6" fill="#16a34a" opacity="0.9" />
            <circle cx="95" cy="72" r="30" fill={pirHigh ? '#fde68a' : '#f5f5f4'} stroke="#a8a29e" />
            <text x="95" y="76" textAnchor="middle" fontSize="9" fill="#44403c">
              {pirHigh ? 'MOTION' : 'PIR'}
            </text>
            <circle cx="150" cy="55" r="3" fill="#d4d4d8" />
            <circle cx="150" cy="80" r="3" fill="#d4d4d8" />
            <circle cx="150" cy="105" r="3" fill="#d4d4d8" />
          </Part>

          {/* ---------------- door slide switch ---------------- */}
          <Part
            label={s.door ? 'Door switch: open. Click to close' : 'Door switch: closed. Click to open'}
            pressed={s.door}
            onActivate={() => {
              toggleDoor(simRef.current)
              rerender()
            }}
          >
            <rect x="40" y="160" width="110" height="52" rx="6" fill="#e5e7eb" stroke="#9ca3af" />
            <rect x="62" y="176" width="64" height="16" rx="3" fill="#6b7280" />
            <rect x={s.door ? 98 : 62} y="172" width="28" height="24" rx="3" fill="#111827" />
            <text x="95" y="206" textAnchor="middle" fontSize="8" fill="#374151">
              door: {s.door ? 'open' : 'closed'}
            </text>
            <circle cx="150" cy="180" r="3" fill="#d4d4d8" />
            <circle cx="150" cy="200" r="3" fill="#d4d4d8" />
          </Part>

          {/* ---------------- ARM button ---------------- */}
          <Part
            label={s.state === 'DISARMED' ? 'ARM button. Click to arm' : 'ARM button. Click to disarm'}
            onActivate={() => {
              pressButton(simRef.current)
              rerender()
            }}
          >
            <rect x="40" y="232" width="110" height="70" rx="6" fill="#e5e7eb" stroke="#9ca3af" />
            <circle cx="95" cy="262" r="20" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2" />
            <text x="95" y="266" textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">
              ARM
            </text>
            <circle cx="150" cy="262" r="3" fill="#6b7280" />
            <circle cx="150" cy="285" r="3" fill="#6b7280" />
          </Part>

          {/* ---------------- OLED ---------------- */}
          <rect x="480" y="25" width="150" height="95" rx="6" fill="#111827" stroke="#374151" />
          <rect x="495" y="38" width="125" height="66" fill="#000" stroke="#1f2937" />
          <text x="557" y="78" textAnchor="middle" fontSize="15" fill="#7dd3fc" fontFamily="monospace">
            {oled}
          </text>
          {[45, 65, 85, 105].map((y) => (
            <circle key={y} cx="480" cy={y} r="3" fill="#d4d4d8" />
          ))}

          {/* ---------------- buzzer ---------------- */}
          <rect x="480" y="170" width="150" height="50" rx="6" fill="#111827" stroke="#374151" />
          <circle cx="585" cy="195" r="16" fill="#1f2937" stroke="#4b5563" />
          {out.buzz && (
            <>
              <path d="M 607 183 q 8 12 0 24" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 614 178 q 12 17 0 34" fill="none" stroke="#f59e0b" strokeWidth="2" />
            </>
          )}
          <text x="518" y="198" fontSize="9" fill="#d4d4d8" fontFamily="monospace">
            BUZZER
          </text>
          <circle cx="480" cy="190" r="3" fill="#d4d4d8" />
          <circle cx="480" cy="208" r="3" fill="#d4d4d8" />

          {/* ---------------- LEDs ---------------- */}
          <rect x="480" y="236" width="150" height="40" rx="6" fill="#111827" stroke="#374151" />
          <rect x="430" y="245" width="24" height="8" rx="2" fill="#d6a56b" />
          <circle
            cx="600"
            cy="256"
            r="10"
            fill={out.green ? '#22c55e' : '#14532d'}
            style={out.green ? { filter: 'drop-shadow(0 0 8px #22c55e)' } : undefined}
          />
          <text x="505" y="259" fontSize="9" fill="#d4d4d8" fontFamily="monospace">
            ARMED
          </text>
          <circle cx="480" cy="252" r="3" fill="#d4d4d8" />
          <circle cx="480" cy="270" r="3" fill="#d4d4d8" />

          <rect x="480" y="296" width="150" height="40" rx="6" fill="#111827" stroke="#374151" />
          <rect x="430" y="305" width="24" height="8" rx="2" fill="#d6a56b" />
          <circle
            cx="600"
            cy="316"
            r="10"
            fill={out.red ? '#ef4444' : '#7f1d1d'}
            style={out.red ? { filter: 'drop-shadow(0 0 8px #ef4444)' } : undefined}
          />
          <text x="505" y="319" fontSize="9" fill="#d4d4d8" fontFamily="monospace">
            ALARM
          </text>
          <circle cx="480" cy="312" r="3" fill="#d4d4d8" />
          <circle cx="480" cy="330" r="3" fill="#d4d4d8" />

          <text x="436" y="244" fontSize="7" fill="currentColor" opacity="0.6" textAnchor="start">
            220
          </text>
          <text x="436" y="304" fontSize="7" fill="currentColor" opacity="0.6" textAnchor="start">
            220
          </text>
        </svg>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div>
          <p className="text-micro text-muted">State</p>
          <p className="nums font-display text-h4 font-semibold leading-none" aria-live="polite">
            {s.state}
          </p>
        </div>
        <ol className="divide-y divide-[var(--c-line)] border border-line text-micro">
          {s.log.length === 0 && <li className="px-3 py-1.5 text-muted">Serial monitor is quiet. Press the ARM button.</li>}
          {s.log.slice(0, 5).map((e) => (
            <li key={e.seq} className="flex justify-between gap-3 px-3 py-1">
              <span className="nums">
                <span className="text-muted">#{e.seq}</span> <span className="text-accent">{e.type}</span>{' '}
                <span className="text-muted">src={e.src}</span>
              </span>
              <span className="nums text-muted">{(e.t / 1000).toFixed(1)}s</span>
            </li>
          ))}
        </ol>
      </div>
    </SimShell>
  )
}
