import { useState } from 'react'
import { SimShell, SimSlider } from './SimShell'
import { cn } from '../../lib/cn'

// ===========================================================================
//  OPERATING POINT SWEEP — interactive
//  The central argument of the IPS-ML project: argmax quietly picks an
//  operating point for you, and it is almost never the one you want inline.
//  The three labelled thresholds below are measured full-test-set values;
//  points between them are interpolated and the note says so.
// ===========================================================================

const MEASURED = [
  { t: 0.01, detection: 1.0, far: 0.375 },
  { t: 0.38, detection: 0.9999, far: 0.00897 },
  { t: 0.95, detection: 0.9766, far: 0.00065 },
]

const BUDGET = 0.01 // the stated 1% false-alarm budget

function interpolate(t) {
  if (t <= MEASURED[0].t) return MEASURED[0]
  if (t >= MEASURED[2].t) return MEASURED[2]
  const i = t <= MEASURED[1].t ? 0 : 1
  const a = MEASURED[i]
  const b = MEASURED[i + 1]
  const k = (t - a.t) / (b.t - a.t)
  return {
    detection: a.detection + (b.detection - a.detection) * k,
    far: a.far + (b.far - a.far) * k,
  }
}

export function ThresholdSweepSim() {
  const [t, setT] = useState(0.38)
  const { detection, far } = interpolate(t)
  const withinBudget = far <= BUDGET

  // Out of every 100,000 benign flows, how many get dropped at this point.
  const benignDropped = Math.round(far * 100000)

  return (
    <SimShell
      title="Where do you put the threshold?"
      onReset={() => setT(0.38)}
      note="Detection and false alarm rates at thresholds 0.01, 0.38 and 0.95 are measured on the full 749,394-flow held-out set. Values between those three points are interpolated."
      controls={
        <SimSlider
          id="ips-threshold"
          label="Allow threshold"
          value={t}
          min={0.01}
          max={0.95}
          step={0.01}
          onChange={setT}
          display={t.toFixed(2)}
        />
      }
    >
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-micro text-muted">Detection rate</p>
          <p className="nums font-display text-h4 font-semibold leading-none">
            {(detection * 100).toFixed(2)}%
          </p>
          <p className="mt-1 text-micro text-muted">of attack flows caught</p>
        </div>
        <div>
          <p className="text-micro text-muted">False alarm rate</p>
          <p
            className={cn(
              'nums font-display text-h4 font-semibold leading-none',
              withinBudget ? 'text-fg' : 'text-[#c2542f]',
            )}
          >
            {(far * 100).toFixed(3)}%
          </p>
          <p className="mt-1 text-micro text-muted">of benign flows blocked</p>
        </div>
        <div>
          <p className="text-micro text-muted">Real cost</p>
          <p
            className={cn(
              'nums font-display text-h4 font-semibold leading-none',
              withinBudget ? 'text-fg' : 'text-[#c2542f]',
            )}
          >
            {benignDropped.toLocaleString()}
          </p>
          <p className="mt-1 text-micro text-muted">legitimate connections dropped per 100,000</p>
        </div>
      </div>

      {/* Both curves on one bar each, so the trade-off is visible at a glance. */}
      <div className="mt-7 space-y-4">
        <Bar label="Detection" value={detection} tone="accent" />
        <Bar label="False alarms" value={Math.min(1, far / 0.4)} tone={withinBudget ? 'muted' : 'bad'} />
      </div>

      <p
        className={cn(
          'mt-6 border p-3 text-small',
          withinBudget ? 'border-line text-muted' : 'border-[#c2542f]/50 text-[#c2542f]',
        )}
      >
        {withinBudget
          ? `Inside the 1% false-alarm budget. Every point on this side of the curve is defensible; which one you pick is a security decision, not a modelling one.`
          : `Outside the 1% false-alarm budget. Detection looks excellent and the device is unusable — at this threshold it drops ${benignDropped.toLocaleString()} legitimate connections in every 100,000.`}
      </p>
    </SimShell>
  )
}

function Bar({ label, value, tone }) {
  const colour = tone === 'accent' ? 'bg-accent' : tone === 'bad' ? 'bg-[#c2542f]' : 'bg-muted'
  return (
    <div>
      <p className="mb-1.5 text-micro text-muted">{label}</p>
      <div className="h-2 w-full bg-line">
        <div
          className={cn('h-full transition-all duration-200 ease-out', colour)}
          style={{ width: `${Math.max(1, value * 100)}%` }}
        />
      </div>
    </div>
  )
}
