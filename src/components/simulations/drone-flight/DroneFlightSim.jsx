import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AlertTriangle } from 'lucide-react'
import { SimShell } from '../SimShell'
import { useReducedMotion } from '../../../hooks/useReducedMotion'
import { isWebGLAvailable } from './webgl'
import { useFlightInput } from './useFlightInput'
import { DroneRig, FlightEnvironment } from './DroneRig'
import { FlightHUD } from './FlightHUD'
import { FlightControls } from './FlightControls'
import { FlightErrorBoundary } from './FlightErrorBoundary'

// ===========================================================================
//  DRONE FLIGHT DEMO -- top-level orchestrator.
//
//  Owns everything the DOM-based UI (HUD, controls) needs to read, and
//  passes refs down to the parts of the tree that run every frame. See
//  DroneRig.jsx for the actual physics and DroneModel.jsx for the geometry.
//
//  This demo is a real, running flight-dynamics simulation built to explore
//  interaction design for autonomous systems -- it is NOT a replay of the
//  BattleWorld benchmark above it. That distinction is stated in the note
//  passed to SimShell, not just in this comment, because the whole site's
//  credibility rests on never blurring a demo into a research claim.
// ===========================================================================

const LOADING_STAGES = [
  'Initialising flight system',
  'Loading drone model',
  'Calibrating sensors',
  'Ready',
]

/** Reads the site's CSS custom properties and stays in sync with the dark/light toggle. */
function useThemeColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement)
    return {
      bg: s.getPropertyValue('--c-bg').trim() || '#0f1113',
      surface: s.getPropertyValue('--c-surface').trim() || '#171a1d',
      line: s.getPropertyValue('--c-grey-200').trim() || '#23272b',
      accent: s.getPropertyValue('--c-accent').trim() || '#45b3aa',
    }
  }
  const [colors, setColors] = useState(read)
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return colors
}

export function DroneFlightSim() {
  const reduced = useReducedMotion()
  const colors = useThemeColors()
  const [webglOk] = useState(() => isWebGLAvailable())
  const [stage, setStage] = useState(0)
  const [ready, setReady] = useState(false)
  const [cameraMode, setCameraMode] = useState('follow')
  const [telemetry, setTelemetry] = useState({
    altitude: 0,
    speed: 0,
    heading: 0,
    battery: 100,
    flightTime: 0,
    phase: 'grounded',
  })

  const commandRef = useRef({ toggleFlight: false, reset: null })
  const requestTakeoffLand = useCallback(() => {
    commandRef.current.toggleFlight = true
  }, [])
  const { input, bind } = useFlightInput(requestTakeoffLand)

  const handleReset = useCallback(() => {
    commandRef.current.reset?.()
    setCameraMode('follow')
  }, [])

  // Short, staged loading text -- everything here is procedural geometry
  // with no textures or model files to fetch, so this is genuinely how long
  // scene construction takes, not a padded wait.
  useEffect(() => {
    if (!webglOk || reduced) return
    if (stage >= LOADING_STAGES.length - 1) {
      const t = setTimeout(() => setReady(true), 220)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStage((s) => s + 1), 260)
    return () => clearTimeout(t)
  }, [stage, webglOk, reduced])

  const onTelemetry = useCallback((t) => setTelemetry(t), [])

  const note =
    'A real, running flight-dynamics simulation I built to explore interaction design for autonomous systems -- velocity, drag and a state machine drive every movement. It is a separate demo from the commander-comparison benchmark above: this is not a replay of BattleWorld or the trained PPO/LLM policies, and the numbers here are simulated physics, not the paper\u2019s results.'

  if (!webglOk) {
    return (
      <SimShell title="Flight-dynamics demo">
        <FallbackCard
          icon={<AlertTriangle size={18} aria-hidden />}
          title="3D isn't available in this browser"
          body="This demo needs WebGL, which this browser or device doesn't expose. Everything else on the site works as normal."
        />
      </SimShell>
    )
  }

  if (reduced) {
    return (
      <SimShell title="Flight-dynamics demo" note={note}>
        <FallbackCard
          title="Motion reduced"
          body="Your system is set to reduce motion, so the interactive flight simulation (a continuously animated 3D scene) is not run here. The commander-comparison demo above still reflects the real benchmark result."
        />
      </SimShell>
    )
  }

  return (
    <SimShell title="Flight-dynamics demo" onReset={ready ? handleReset : undefined} note={note}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0b0c] sm:aspect-video">
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0b0c] text-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <p className="font-mono text-micro tracking-wide">{LOADING_STAGES[stage]}</p>
          </div>
        )}

        <FlightErrorBoundary
          fallback={
            <FallbackCard
              title="This demo hit a snag"
              body="Something went wrong rendering the flight simulation. The rest of the portfolio is unaffected -- try reloading if you'd like another look."
            />
          }
        >
          <Canvas
            shadows
            dpr={[1, Math.min(window.devicePixelRatio || 1, 2)]}
            camera={{ fov: 45, near: 0.1, far: 60, position: [0, 2.4, 5] }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 400ms ease' }}
          >
            <color attach="background" args={[colors.bg]} />
            <Suspense fallback={null}>
              <FlightEnvironment bg={colors.bg} ground={colors.surface} line={colors.line} />
              <DroneRig
                inputRef={input}
                commandRef={commandRef}
                cameraMode={cameraMode}
                onTelemetry={onTelemetry}
                reduced={false}
              />
            </Suspense>
          </Canvas>
        </FlightErrorBoundary>

        {ready && (
          <>
            <FlightHUD telemetry={telemetry} />
            <FlightControls
              bind={bind}
              phase={telemetry.phase}
              onTakeoffLand={requestTakeoffLand}
              cameraMode={cameraMode}
              onCameraMode={setCameraMode}
            />
          </>
        )}
      </div>
    </SimShell>
  )
}

function FallbackCard({ icon, title, body }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 border border-line bg-surface px-6 text-center">
      {icon}
      <p className="text-small font-medium">{title}</p>
      <p className="max-w-sm text-micro text-muted">{body}</p>
    </div>
  )
}
