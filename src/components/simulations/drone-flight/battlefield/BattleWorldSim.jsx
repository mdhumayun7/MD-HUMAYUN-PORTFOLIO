import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AlertTriangle, Trophy } from 'lucide-react'
import { SimShell } from '../../SimShell'
import { useReducedMotion } from '../../../../hooks/useReducedMotion'
import { isWebGLAvailable } from '../webgl'
import { useFlightInput } from '../useFlightInput'
import { FlightErrorBoundary } from '../FlightErrorBoundary'
import { BattlefieldRig } from './BattlefieldRig'
import { MissionHUD } from './MissionHUD'
import { BattlefieldControls } from './BattlefieldControls'
import { loadBest, saveMissionResult, formatTime } from './missionStorage'

// ===========================================================================
//  BATTLEWORLD MISSION -- top-level orchestrator.
//
//  Same shape as DroneFlightSim.jsx (WebGL check, reduced-motion fallback,
//  staged loading, error boundary) with a mission layer on top: hostile
//  count, elapsed time, and a save-on-completion step using localStorage.
//
//  Stated plainly, because this demo sits right next to two research
//  results: the swarm-mate and sentry behaviour are simple, hand-written
//  steering rules I wrote for this demo, not the trained PPO/LLM commander
//  policies from the dissertation, and "neutralising" a sentry is a
//  stylised signal-disable effect, not a weapons simulation.
// ===========================================================================

const LOADING_STAGES = ['Deploying swarm', 'Loading arena', 'Locating hostiles', 'Ready']

function useThemeColors() {
  const read = () => {
    const s = getComputedStyle(document.documentElement)
    return { bg: s.getPropertyValue('--c-bg').trim() || '#0f1113' }
  }
  const [colors, setColors] = useState(read)
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return colors
}

export function BattleWorldSim() {
  const reduced = useReducedMotion()
  const colors = useThemeColors()
  const [webglOk] = useState(() => isWebGLAvailable())
  const [stage, setStage] = useState(0)
  const [ready, setReady] = useState(false)
  const [cameraMode, setCameraMode] = useState('follow')
  const [mission, setMission] = useState({ status: 'engaging', time: 0, hostilesRemaining: 5, hostilesTotal: 5 })
  const [best, setBest] = useState(() => loadBest())
  const [runKey, setRunKey] = useState(0)
  const savedRef = useRef(false)

  const { input, bind } = useFlightInput()

  useEffect(() => {
    if (!webglOk || reduced) return
    if (stage >= LOADING_STAGES.length - 1) {
      const t = setTimeout(() => setReady(true), 220)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setStage((s) => s + 1), 260)
    return () => clearTimeout(t)
  }, [stage, webglOk, reduced])

  const onMission = useCallback((m) => {
    setMission(m)
    if (m.status === 'complete' && !savedRef.current) {
      savedRef.current = true
      const { best: newBest } = saveMissionResult({ time: m.time, hostilesNeutralized: m.hostilesTotal })
      setBest(newBest)
    }
  }, [])

  const handleReset = useCallback(() => {
    savedRef.current = false
    setCameraMode('follow')
    setMission({ status: 'engaging', time: 0, hostilesRemaining: 5, hostilesTotal: 5 })
    setRunKey((k) => k + 1) // remounts BattlefieldRig, which re-seeds every agent
  }, [])

  const note =
    'A small mission built on the same flight model as the flight-dynamics demo above, with three AI swarm-mates and five sentry drones added. The swarm-mate and sentry behaviour are simple steering rules I wrote for this demo -- not the trained PPO/LLM commander policies from the dissertation -- and "neutralising" a sentry is a stylised signal-disable effect, not a weapons simulation. Your best time is saved in this browser.'

  if (!webglOk) {
    return (
      <SimShell title="BattleWorld mission">
        <Fallback icon={<AlertTriangle size={18} aria-hidden />} title="3D isn't available in this browser"
          body="This demo needs WebGL, which this browser or device doesn't expose. Everything else on the site works as normal." />
      </SimShell>
    )
  }

  if (reduced) {
    return (
      <SimShell title="BattleWorld mission" note={note}>
        <Fallback title="Motion reduced"
          body="Your system is set to reduce motion, so this continuously animated mission scene is not run here." />
      </SimShell>
    )
  }

  return (
    <SimShell title="BattleWorld mission" onReset={ready ? handleReset : undefined} note={note}>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0a0b0c] sm:aspect-video">
        {!ready && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0a0b0c] text-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <p className="font-mono text-micro tracking-wide">{LOADING_STAGES[stage]}</p>
          </div>
        )}

        <FlightErrorBoundary
          fallback={<Fallback title="This demo hit a snag" body="Something went wrong rendering the mission scene. The rest of the portfolio is unaffected." />}
        >
          <Canvas
            key={runKey}
            shadows
            dpr={[1, Math.min(window.devicePixelRatio || 1, 2)]}
            camera={{ fov: 48, near: 0.1, far: 80, position: [0, 3, -14] }}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
            style={{ opacity: ready ? 1 : 0, transition: 'opacity 400ms ease' }}
          >
            <color attach="background" args={[colors.bg]} />
            <fogExp2 attach="fog" args={[colors.bg, 0.028]} />
            <Suspense fallback={null}>
              <BattlefieldRig inputRef={input} cameraMode={cameraMode} onMission={onMission} reduced={false} />
            </Suspense>
          </Canvas>
        </FlightErrorBoundary>

        {ready && (
          <>
            <MissionHUD mission={mission} best={best} />
            <BattlefieldControls bind={bind} cameraMode={cameraMode} onCameraMode={setCameraMode} />

            {mission.status === 'complete' && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="pointer-events-auto flex flex-col items-center gap-2 border border-white/20 bg-black/70 px-6 py-5 text-center backdrop-blur-sm">
                  <Trophy size={20} className="text-[#6be0d4]" aria-hidden />
                  <p className="font-mono text-small text-white">MISSION COMPLETE</p>
                  <p className="font-mono text-micro text-white/60">
                    Time {formatTime(mission.time)}
                    {best && best.time === mission.time ? ' \u2014 new best' : best ? ` \u00b7 best ${formatTime(best.time)}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-1 border border-white/30 px-3 py-1.5 text-micro text-white/90 transition-colors hover:border-[#6be0d4] hover:text-[#6be0d4]"
                  >
                    Run again
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SimShell>
  )
}

function Fallback({ icon, title, body }) {
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 border border-line bg-surface px-6 text-center">
      {icon}
      <p className="text-small font-medium">{title}</p>
      <p className="max-w-sm text-micro text-muted">{body}</p>
    </div>
  )
}
