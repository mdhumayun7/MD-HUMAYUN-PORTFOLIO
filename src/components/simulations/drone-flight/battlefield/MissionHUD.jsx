import { cn } from '../../../../lib/cn'
import { formatTime } from './missionStorage'

// ===========================================================================
//  MISSION HUD
//  Everything here comes from the mission state BattlefieldRig computes each
//  frame -- hostile count, elapsed time and status are the same numbers the
//  mission-complete summary and the saved log use, not a separate display-only
//  copy of them.
// ===========================================================================

const STATUS_LABEL = {
  engaging: 'HOSTILES DETECTED',
  'en-route': 'EN ROUTE TO TARGET',
  complete: 'MISSION COMPLETE',
}

function Metric({ label, value, tone }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] tracking-wide text-white/50">{label}</span>
      <span className={cn('nums font-mono text-[13px]', tone || 'text-white/90')}>{value}</span>
    </div>
  )
}

export function MissionHUD({ mission, best }) {
  const { hostilesRemaining, hostilesTotal, time, status } = mission

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-between p-3 sm:p-4">
      <div className="space-y-1 bg-black/35 px-3 py-2 backdrop-blur-sm">
        <Metric
          label="HOSTILES"
          value={`${hostilesRemaining} / ${hostilesTotal}`}
          tone={hostilesRemaining > 0 ? 'text-[#e5787c]' : 'text-[#6be0d4]'}
        />
        <Metric label="TIME" value={formatTime(time)} />
        {best && <Metric label="BEST" value={formatTime(best.time)} tone="text-white/50" />}
      </div>
      <div className="bg-black/35 px-3 py-2 text-right backdrop-blur-sm">
        <Metric
          label="STATUS"
          value={STATUS_LABEL[status] || status.toUpperCase()}
          tone={status === 'complete' ? 'text-[#6be0d4]' : 'text-white/90'}
        />
      </div>
    </div>
  )
}
