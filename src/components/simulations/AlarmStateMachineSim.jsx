import { useCallback, useEffect, useRef, useState } from 'react'
import { SimShell } from './SimShell'
import { cn } from '../../lib/cn'

// ===========================================================================
//  ALARM STATE MACHINE — interactive
//  A JavaScript port of the arm / disarm state machine in the ESP32 firmware
//  (firmware/smart_home/smart_home.ino, v2.1.0). The transitions, the three
//  timers and the event names are taken from that file. What is NOT here:
//  real GPIO, the PIR warm-up and confirmation filter, button debounce, and
//  the network stack. The clock is simulated, so the speed control only
//  changes how fast simulated time passes.
// ===========================================================================

const EXIT_MS = 10000
const ENTRY_MS = 10000
const ALARM_MS = 30000
const QUEUE_CAP = 16
const TICK_MS = 50
const LOG_MAX = 14

const LABEL = {
  DISARMED: 'DISARMED',
  EXIT_DELAY: 'EXIT_DELAY',
  ARMED: 'ARMED',
  ENTRY_DELAY: 'ENTRY_DELAY',
  ALARM: 'ALARM',
}

function createSim() {
  return {
    now: 0,
    state: 'DISARMED',
    since: 0,
    seq: 0,
    log: [],
    door: false, // true = open
    pirUntil: 0,
    pirRaised: false,
    online: true,
    queued: 0,
    delivered: 0,
    dropped: 0,
    beepUntil: 0,
    alarms: 0,
  }
}

function emit(s, type, src) {
  s.seq += 1
  const entry = { seq: s.seq, type, src, t: s.now, late: false, held: false }
  if (s.online) {
    s.delivered += 1
  } else if (s.queued < QUEUE_CAP) {
    s.queued += 1
    entry.held = true
  } else {
    s.dropped += 1
    entry.dropped = true
  }
  s.log.unshift(entry)
  if (s.log.length > LOG_MAX) s.log.length = LOG_MAX
}

function setState(s, next, type, src) {
  s.state = next
  s.since = s.now
  emit(s, type, src)
}

function trigger(s, cause, src) {
  emit(s, cause, src)
  setState(s, 'ENTRY_DELAY', 'entry_delay', src)
}

function pressButton(s) {
  if (s.state === 'DISARMED') {
    setState(s, 'EXIT_DELAY', 'exit_delay', 'button')
  } else {
    setState(s, 'DISARMED', 'disarmed', 'button')
    s.beepUntil = s.now + 150
  }
}

function toggleDoor(s) {
  s.door = !s.door
  if (s.door && s.state === 'ARMED') trigger(s, 'door_open', 'door')
  else emit(s, s.door ? 'door_open' : 'door_closed', 'door')
}

function raiseMotion(s) {
  // The firmware requires PIR HIGH for 150 ms past warm-up; the demo assumes
  // both are satisfied and shows the PIR line high for one second.
  s.pirUntil = s.now + 1000
  if (!s.pirRaised) {
    s.pirRaised = true
    if (s.state === 'ARMED') trigger(s, 'motion', 'pir')
  }
}

function remoteArm(s) {
  if (s.state === 'DISARMED') setState(s, 'EXIT_DELAY', 'exit_delay', 'remote')
  else emit(s, 'cmd_ignored', 'remote')
}

function remoteDisarm(s) {
  // ALLOW_REMOTE_DISARM defaults to 0 in the firmware, so this is rejected.
  emit(s, 'cmd_rejected', 'remote')
}

function setOnline(s, online) {
  if (s.online === online) return
  s.online = online
  if (online) {
    s.log.forEach((e) => {
      if (e.held) {
        e.held = false
        e.late = true
      }
    })
    s.delivered += s.queued
    s.queued = 0
  }
}

function advance(s, dt) {
  s.now += dt
  if (s.pirRaised && s.now >= s.pirUntil) s.pirRaised = false
  const elapsed = s.now - s.since
  switch (s.state) {
    case 'EXIT_DELAY':
      if (elapsed >= EXIT_MS) {
        setState(s, 'ARMED', 'armed', 'timer')
        s.beepUntil = s.now + 300
        if (s.door) trigger(s, 'door_open', 'door') // left open after exit
      }
      break
    case 'ENTRY_DELAY':
      if (elapsed >= ENTRY_MS) {
        s.alarms += 1
        setState(s, 'ALARM', 'alarm', 'timer')
      }
      break
    case 'ALARM':
      if (elapsed >= ALARM_MS) setState(s, 'ARMED', 'alarm_end', 'timer')
      break
    default:
      break
  }
}

function outputs(s) {
  const t = s.now - s.since
  let buzz = s.now < s.beepUntil
  let green = false
  let red = false
  switch (s.state) {
    case 'EXIT_DELAY':
      buzz = buzz || t % 1000 < 60
      green = Math.floor(s.now / 500) % 2 === 0
      break
    case 'ARMED':
      green = true
      break
    case 'ENTRY_DELAY':
      buzz = buzz || t % 400 < 150
      red = Math.floor(s.now / 500) % 2 === 0
      break
    case 'ALARM':
      buzz = buzz || t % 600 < 400
      red = Math.floor(s.now / 100) % 2 === 0
      break
    default:
      break
  }
  return { buzz, green, red }
}

function oledLine(s) {
  const t = s.now - s.since
  const left = (dur) => Math.max(0, Math.ceil((dur - t) / 1000))
  switch (s.state) {
    case 'EXIT_DELAY':
      return `EXIT ${left(EXIT_MS)}s`
    case 'ENTRY_DELAY':
      return `ENTRY ${left(ENTRY_MS)}s`
    case 'ALARM':
      return 'ALARM!'
    default:
      return s.state
  }
}

function windowFor(state) {
  if (state === 'EXIT_DELAY') return EXIT_MS
  if (state === 'ENTRY_DELAY') return ENTRY_MS
  if (state === 'ALARM') return ALARM_MS
  return 0
}

function Led({ on, color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn('block h-3.5 w-3.5 rounded-full border', on ? 'border-transparent' : 'border-line')}
        style={on ? { background: color, boxShadow: `0 0 10px ${color}` } : undefined}
      />
      <span className="text-micro text-muted">
        {label}
        <span className="sr-only">{on ? ' on' : ' off'}</span>
      </span>
    </div>
  )
}

const BTN =
  'border border-line px-3 py-1.5 text-small transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40'

export function AlarmStateMachineSim() {
  const simRef = useRef(createSim())
  const [, bump] = useState(0)
  const [speed, setSpeed] = useState(1)

  const rerender = useCallback(() => bump((n) => n + 1), [])

  useEffect(() => {
    const id = setInterval(() => {
      advance(simRef.current, TICK_MS * speed)
      rerender()
    }, TICK_MS)
    return () => clearInterval(id)
  }, [speed, rerender])

  const act = (fn) => () => {
    fn(simRef.current)
    rerender()
  }

  const reset = () => {
    simRef.current = createSim()
    rerender()
  }

  const s = simRef.current
  const out = outputs(s)
  const total = windowFor(s.state)
  const progress = total ? Math.min(1, (s.now - s.since) / total) : 0
  const timerOn = s.state === 'EXIT_DELAY' || s.state === 'ENTRY_DELAY' || s.state === 'ALARM'

  return (
    <SimShell
      title="Drive the alarm state machine"
      onReset={reset}
      note="A port of the firmware's state machine: the 10 s exit delay, 10 s entry delay, 30 s alarm timeout, the transitions and the event names come from smart_home.ino v2.1.0. Simulated clock only. The PIR warm-up and confirmation filter, debounce, GPIO and the network stack are not modelled, and remote DISARM is rejected because the firmware ships with ALLOW_REMOTE_DISARM set to 0."
      controls={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={BTN} onClick={act(pressButton)}>
              {s.state === 'DISARMED' ? 'Press ARM button' : 'Press DISARM button'}
            </button>
            <button type="button" className={BTN} onClick={act(toggleDoor)} aria-pressed={s.door}>
              {s.door ? 'Close door' : 'Open door'}
            </button>
            <button type="button" className={BTN} onClick={act(raiseMotion)}>
              Raise motion (PIR)
            </button>
            <button type="button" className={BTN} onClick={act(remoteArm)}>
              MQTT cmd: ARM
            </button>
            <button type="button" className={BTN} onClick={act(remoteDisarm)}>
              MQTT cmd: DISARM
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-small">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={!s.online}
                onChange={(e) => {
                  setOnline(simRef.current, !e.target.checked)
                  rerender()
                }}
                className="accent-[var(--c-accent)]"
              />
              Network offline
            </label>
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
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="text-micro text-muted">State</p>
          <p className="nums font-display text-h4 font-semibold leading-none" aria-live="polite">
            {LABEL[s.state]}
          </p>

          <div className="mt-3 h-1 w-full bg-line" aria-hidden>
            <div
              className="h-full bg-[var(--c-accent)]"
              style={{ width: `${timerOn ? progress * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1 text-micro text-muted">
            {timerOn ? `${(total / 1000).toFixed(0)} s window` : 'no timer running'}
          </p>

          <div
            className="mt-5 inline-block border border-line bg-black px-4 py-3"
            aria-label={`OLED shows ${oledLine(s)}`}
          >
            <span className="nums font-mono text-small tracking-widest text-sky-300">{oledLine(s)}</span>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            <Led on={out.green} color="#22c55e" label="Armed LED (GPIO 26)" />
            <Led on={out.red} color="#ef4444" label="Alarm LED (GPIO 25)" />
            <Led on={out.buzz} color="#f59e0b" label="Buzzer (GPIO 23)" />
          </div>

          <dl className="mt-5 grid grid-cols-3 gap-4 text-micro">
            <div>
              <dt className="text-muted">Door</dt>
              <dd className="nums text-small">{s.door ? 'open' : 'closed'}</dd>
            </div>
            <div>
              <dt className="text-muted">PIR</dt>
              <dd className="nums text-small">{s.pirRaised ? 'HIGH' : 'low'}</dd>
            </div>
            <div>
              <dt className="text-muted">Alarms</dt>
              <dd className="nums text-small">{s.alarms}</dd>
            </div>
          </dl>
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-micro text-muted">Event stream (svnit/smarthome/&lt;id&gt;/event)</p>
            <p className="nums text-micro text-muted">
              {s.online ? 'online' : `offline, ${s.queued}/${QUEUE_CAP} queued`}
              {s.dropped > 0 && `, ${s.dropped} dropped`}
            </p>
          </div>
          <ol className="mt-2 divide-y divide-[var(--c-line)] border border-line text-micro" style={{ minHeight: '14rem' }}>
            {s.log.length === 0 && <li className="px-3 py-2 text-muted">No events yet. Press ARM.</li>}
            {s.log.map((e) => (
              <li key={e.seq} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                <span className="nums truncate">
                  <span className="text-muted">#{e.seq}</span>{' '}
                  <span className="text-accent">{e.type}</span>{' '}
                  <span className="text-muted">src={e.src}</span>
                </span>
                <span className="nums shrink-0 text-muted">
                  {(e.t / 1000).toFixed(1)}s
                  {e.held && ' · held in queue'}
                  {e.late && ' · delivered late'}
                  {e.dropped && ' · dropped'}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </SimShell>
  )
}
