import { cn } from '../../../lib/cn'

// ===========================================================================
//  HUD -- plain HTML/CSS overlaid on the canvas, not drawn inside the 3D
//  scene. Every value here comes from the telemetry object DroneRig pushes
//  up at ~6Hz; nothing on this panel is decorative or hand-typed.
// ===========================================================================

const STATUS_LABEL = {
  grounded: 'GROUNDED',
  arming: 'ARMING',
  takeoff: 'TAKEOFF',
  hover: 'STABLE',
  moving: 'MOVING',
  braking: 'BRAKING',
  landing: 'LANDING',
}

function Metric({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] tracking-wide text-white/50">{label}</span>
      <span className="nums font-mono text-[13px] text-white/90">{value}</span>
    </div>
  )
}

export function FlightHUD({ telemetry }) {
  const { altitude, speed, heading, battery, flightTime, phase } = telemetry
  const mm = String(Math.floor(flightTime / 60)).padStart(2, '0')
  const ss = String(Math.floor(flightTime % 60)).padStart(2, '0')

  return (
    <div className="pointer-events-none absolute inset-0 p-3 sm:p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1 bg-black/35 px-3 py-2 backdrop-blur-sm">
          <Metric label="ALT" value={`${altitude.toFixed(1)} m`} />
          <Metric label="SPD" value={`${speed.toFixed(1)} m/s`} />
          <Metric label="TIME" value={`${mm}:${ss}`} />
        </div>
        <div className="space-y-1 bg-black/35 px-3 py-2 text-right backdrop-blur-sm">
          <Metric label="BAT" value={`${Math.round(battery)}%`} />
          <Metric label="HDG" value={`${Math.round(heading)}\u00b0`} />
          <div className="flex items-baseline justify-end gap-1.5">
            <span className="text-[10px] tracking-wide text-white/50">STATUS</span>
            <span
              className={cn(
                'font-mono text-[13px]',
                phase === 'grounded' ? 'text-white/60' : 'text-[#6be0d4]',
              )}
            >
              {STATUS_LABEL[phase] || phase.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
