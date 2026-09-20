import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { cn } from '../../../../lib/cn'

// ===========================================================================
//  BATTLEFIELD CONTROLS
//
//  Same press-and-hold pattern as FlightControls (the flight-dynamics demo),
//  kept as its own small component rather than a shared one: the flagship
//  here has no ground/arming/landing phase to gate a takeoff button against,
//  so trying to force one component to cover both would have meant a pile of
//  "if this is the battlefield" branches inside otherwise-working code.
// ===========================================================================

const MODES = ['follow', 'onboard', 'cinematic', 'tactical']

function Pad({ label, Icon, bindProps }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...bindProps}
      onContextMenu={(e) => e.preventDefault()}
      className="flex h-11 w-11 select-none items-center justify-center border border-white/15 bg-black/40
                 text-white/80 backdrop-blur-sm transition-colors active:bg-white/20 active:text-white touch-none"
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}

export function BattlefieldControls({ bind, cameraMode, onCameraMode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-3 sm:p-4">
      <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={cameraMode === mode}
            onClick={() => onCameraMode(mode)}
            className={cn(
              'border px-2.5 py-1 text-micro capitalize backdrop-blur-sm transition-colors',
              cameraMode === mode
                ? 'border-white/70 bg-white/90 text-black'
                : 'border-white/20 bg-black/40 text-white/70 hover:border-white/50 hover:text-white',
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="pointer-events-auto flex items-end justify-between">
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          <div />
          <Pad label="Forward" Icon={ArrowUp} bindProps={bind('forward')} />
          <div />
          <Pad label="Left" Icon={ArrowLeft} bindProps={bind('left')} />
          <Pad label="Back" Icon={ArrowDown} bindProps={bind('backward')} />
          <Pad label="Right" Icon={ArrowRight} bindProps={bind('right')} />
        </div>

        <div className="grid grid-cols-2 gap-1">
          <Pad label="Ascend" Icon={ChevronUp} bindProps={bind('up')} />
          <Pad label="Yaw left" Icon={RotateCcw} bindProps={bind('yawLeft')} />
          <Pad label="Descend" Icon={ChevronDown} bindProps={bind('down')} />
          <Pad label="Yaw right" Icon={RotateCw} bindProps={bind('yawRight')} />
        </div>
      </div>

      <p className="hidden text-center font-mono text-[10px] tracking-wide text-white/40 sm:block">
        WASD move &middot; Q/E yaw &middot; Space/Shift altitude &middot; escort the swarm to the target
      </p>
    </div>
  )
}
