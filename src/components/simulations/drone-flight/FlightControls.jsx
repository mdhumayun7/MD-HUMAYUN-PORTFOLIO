import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Plane,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { cn } from '../../../lib/cn'

// ===========================================================================
//  ON-SCREEN CONTROLS
//
//  Rendered on every screen size, not only touch devices: the brief asks for
//  controls a visitor can use without knowing the keyboard scheme, and a
//  mouse can hold these down exactly the way a finger can.
//
//  Every button is bound through the same `bind(key)` press-and-hold
//  handlers useFlightInput exposes, so touch, mouse and keyboard all drive
//  one input model -- there is no separate "mobile" code path to keep in
//  sync with the desktop one.
// ===========================================================================

function Pad({ label, Icon, bindProps, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      {...bindProps}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        'flex h-11 w-11 select-none items-center justify-center border border-white/15 bg-black/40',
        'text-white/80 backdrop-blur-sm transition-colors active:bg-white/20 active:text-white',
        'touch-none',
        className,
      )}
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}

export function FlightControls({ bind, phase, onTakeoffLand, cameraMode, onCameraMode }) {
  const transitioning = ['arming', 'takeoff', 'landing'].includes(phase)

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 p-3 sm:p-4">
      {/* Camera mode -- reuses the same chip styling as the project filter
          bar above, so this reads as part of the same site rather than a
          bolted-on widget. */}
      <div className="pointer-events-auto flex justify-center gap-2">
        {['follow', 'onboard', 'cinematic'].map((mode) => (
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
        {/* movement d-pad */}
        <div className="grid grid-cols-3 grid-rows-3 gap-1">
          <div />
          <Pad label="Forward" Icon={ArrowUp} bindProps={bind('forward')} />
          <div />
          <Pad label="Left" Icon={ArrowLeft} bindProps={bind('left')} />
          <Pad label="Back" Icon={ArrowDown} bindProps={bind('backward')} />
          <Pad label="Right" Icon={ArrowRight} bindProps={bind('right')} />
        </div>

        {/* takeoff / land */}
        <button
          type="button"
          onClick={onTakeoffLand}
          disabled={transitioning}
          className={cn(
            'flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full border text-[10px] font-medium backdrop-blur-sm transition-colors',
            transitioning
              ? 'cursor-not-allowed border-white/10 bg-black/30 text-white/30'
              : phase === 'grounded'
                ? 'border-[#6be0d4]/70 bg-[#6be0d4]/20 text-[#6be0d4] hover:bg-[#6be0d4]/30'
                : 'border-white/50 bg-white/10 text-white/90 hover:bg-white/20',
          )}
        >
          <Plane size={16} aria-hidden />
          {phase === 'grounded' ? 'FLY' : 'LAND'}
        </button>

        {/* altitude + yaw */}
        <div className="grid grid-cols-2 gap-1">
          <Pad label="Ascend" Icon={ChevronUp} bindProps={bind('up')} />
          <Pad label="Yaw left" Icon={RotateCcw} bindProps={bind('yawLeft')} />
          <Pad label="Descend" Icon={ChevronDown} bindProps={bind('down')} />
          <Pad label="Yaw right" Icon={RotateCw} bindProps={bind('yawRight')} />
        </div>
      </div>

      {/* keyboard hint -- desktop only, hidden once a phone couldn't use it anyway */}
      <p className="hidden text-center font-mono text-[10px] tracking-wide text-white/40 sm:block">
        WASD move &middot; Q/E yaw &middot; Space/Shift altitude &middot; T take off / land
      </p>
    </div>
  )
}
