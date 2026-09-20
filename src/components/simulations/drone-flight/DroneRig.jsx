import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { DroneModel, makePartsRef } from './DroneModel'

// ===========================================================================
//  FLIGHT MODEL
//
//  One velocity-based physics model drives every axis (forward/back,
//  left/right, up/down, yaw) instead of separate scripted animations per
//  direction. Holding an input accelerates the drone toward its max speed on
//  that axis; releasing it lets drag decelerate it back to rest -- which is
//  what gives the "it doesn't just stop" feel the brief asks for, on every
//  axis, for free, rather than as a special case.
//
//  Everything physical lives in `state.current`, a plain mutable object.
//  useFrame runs up to 60 times a second outside React's render cycle, so
//  mutating refs directly (not calling setState) is what keeps this
//  smooth -- React state here is only used for the low-frequency values the
//  DOM-based HUD needs to read (see the throttled telemetry callback below).
// ===========================================================================

const MAX_H_SPEED = 6 // m/s, horizontal
const MAX_V_SPEED = 2.2 // m/s, vertical
const MAX_YAW_RATE = 1.7 // rad/s
const ACCEL = 10 // m/s^2 while an input is held
const DRAG = 3.1 // 1/s, exponential decay applied when an axis has no input
const HOVER_ALT = 3.1
const GROUND_ALT = 0.16
const MAX_ALT = 7.5
const MAX_TILT = 0.32 // radians (~18 degrees) -- kept modest per the brief
const ARM_DURATION = 0.55 // seconds for props to spin up before ascent
const SETTLE_DURATION = 0.5 // seconds for props to spin down after landing

function freshState() {
  return {
    phase: 'grounded', // grounded | arming | takeoff | hover | moving | braking | landing
    position: new THREE.Vector3(0, GROUND_ALT, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    roll: 0,
    gimbalPitch: 0,
    propSpin: 0, // 0..1, ramps with arming/settling
    phaseTimer: 0,
    flightTime: 0,
    battery: 100,
  }
}

export function DroneRig({ inputRef, commandRef, cameraMode, onTelemetry, reduced }) {
  const state = useRef(freshState())
  const parts = useRef(makePartsRef())
  const groupRef = useRef()
  const telemetryAccum = useRef(0)
  const { camera } = useThree()
  const camTarget = useRef(new THREE.Vector3())
  const camLookAt = useRef(new THREE.Vector3())

  // Reset is exposed to the parent via commandRef so the visible Reset
  // button can put the whole simulation back to a known, grounded state.
  useEffect(() => {
    commandRef.current.reset = () => {
      state.current = freshState()
    }
  }, [commandRef])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05) // guard against a huge jump after a tab loses focus
    const s = state.current
    const input = inputRef.current

    // ---- takeoff / land request, issued by button or the T / Enter key --
    if (commandRef.current.toggleFlight) {
      commandRef.current.toggleFlight = false
      if (s.phase === 'grounded') {
        s.phase = 'arming'
        s.phaseTimer = 0
      } else if (['hover', 'moving', 'braking'].includes(s.phase)) {
        s.phase = 'landing'
      }
    }

    // ---- phase-specific behaviour ---------------------------------------
    if (s.phase === 'arming') {
      s.phaseTimer += dt
      s.propSpin = Math.min(1, s.phaseTimer / ARM_DURATION)
      if (s.phaseTimer >= ARM_DURATION) {
        s.phase = 'takeoff'
        s.velocity.y = MAX_V_SPEED * 0.6
      }
    } else if (s.phase === 'takeoff') {
      s.propSpin = 1
      s.flightTime += dt
      s.position.y += s.velocity.y * dt
      if (s.position.y >= HOVER_ALT) {
        s.position.y = HOVER_ALT
        s.velocity.y = 0
        s.phase = 'hover'
      }
    } else if (s.phase === 'landing') {
      s.propSpin = 1
      s.flightTime += dt
      // Decelerate horizontally faster than normal drag so the drone settles
      // roughly level before it touches down, then sink at a capped rate.
      s.velocity.x *= Math.max(0, 1 - DRAG * 2 * dt)
      s.velocity.z *= Math.max(0, 1 - DRAG * 2 * dt)
      s.velocity.y = -MAX_V_SPEED * 0.55
      s.position.addScaledVector(s.velocity, dt)
      if (s.position.y <= GROUND_ALT) {
        s.position.y = GROUND_ALT
        s.velocity.set(0, 0, 0)
        s.phase = 'grounded'
        s.phaseTimer = 0
      }
    } else if (s.phase === 'grounded') {
      s.propSpin = Math.max(0, s.propSpin - dt / SETTLE_DURATION)
    } else {
      // hover / moving / braking share one model: accelerate on any held
      // axis, drag on any axis with nothing held.
      s.flightTime += dt
      s.propSpin = 1

      const forwardVec = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw))
      const rightVec = new THREE.Vector3(Math.cos(s.yaw), 0, -Math.sin(s.yaw))
      const thrust = new THREE.Vector3()
      if (input.forward) thrust.add(forwardVec)
      if (input.backward) thrust.addScaledVector(forwardVec, -1)
      if (input.right) thrust.add(rightVec)
      if (input.left) thrust.addScaledVector(rightVec, -1)
      const hasHorizontalInput = thrust.lengthSq() > 0
      if (hasHorizontalInput) {
        thrust.normalize()
        s.velocity.x += thrust.x * ACCEL * dt
        s.velocity.z += thrust.z * ACCEL * dt
        const h = Math.hypot(s.velocity.x, s.velocity.z)
        if (h > MAX_H_SPEED) {
          s.velocity.x = (s.velocity.x / h) * MAX_H_SPEED
          s.velocity.z = (s.velocity.z / h) * MAX_H_SPEED
        }
      } else {
        const decay = Math.max(0, 1 - DRAG * dt)
        s.velocity.x *= decay
        s.velocity.z *= decay
      }

      const vertInput = (input.up ? 1 : 0) - (input.down ? 1 : 0)
      if (vertInput !== 0) {
        s.velocity.y += vertInput * ACCEL * 0.7 * dt
        s.velocity.y = THREE.MathUtils.clamp(s.velocity.y, -MAX_V_SPEED, MAX_V_SPEED)
      } else {
        s.velocity.y *= Math.max(0, 1 - DRAG * dt)
      }

      const yawInput = (input.yawRight ? 1 : 0) - (input.yawLeft ? 1 : 0)
      s.yaw += yawInput * MAX_YAW_RATE * dt

      s.position.addScaledVector(s.velocity, dt)
      s.position.y = THREE.MathUtils.clamp(s.position.y, GROUND_ALT + 0.3, MAX_ALT)

      const speed = s.velocity.length()
      s.phase = speed > 0.18 ? 'moving' : speed > 0.02 ? 'braking' : 'hover'
    }

    // ---- body attitude: tilt communicates acceleration, not position ----
    const localForwardSpeed = s.velocity.x * Math.sin(s.yaw) + s.velocity.z * Math.cos(s.yaw)
    const localRightSpeed = s.velocity.x * Math.cos(s.yaw) - s.velocity.z * Math.sin(s.yaw)
    const targetPitch = THREE.MathUtils.clamp(
      -(localForwardSpeed / MAX_H_SPEED) * MAX_TILT,
      -MAX_TILT,
      MAX_TILT,
    )
    const targetRoll = THREE.MathUtils.clamp(
      -(localRightSpeed / MAX_H_SPEED) * MAX_TILT,
      -MAX_TILT,
      MAX_TILT,
    )
    const smooth = 1 - Math.exp(-6 * dt) // frame-rate independent easing
    s.pitch += (targetPitch - s.pitch) * smooth
    s.roll += (targetRoll - s.roll) * smooth
    s.gimbalPitch += (-s.pitch * 0.55 - s.gimbalPitch) * smooth // partial stabilisation

    // hover has a small constant micro-correction so it never looks frozen
    const microTime = performance.now() / 1000
    const microX = s.phase === 'hover' ? Math.sin(microTime * 1.7) * 0.012 : 0
    const microZ = s.phase === 'hover' ? Math.cos(microTime * 1.3) * 0.012 : 0

    if (groupRef.current) {
      groupRef.current.position.set(
        s.position.x + microX,
        s.position.y,
        s.position.z + microZ,
      )
      groupRef.current.rotation.set(s.roll, s.yaw, -s.pitch, 'YXZ')
    }
    if (parts.current.gimbal) {
      parts.current.gimbal.rotation.x = s.gimbalPitch
    }
    parts.current.props.forEach((p, i) => {
      if (p) p.rotation.y += (i % 2 === 0 ? 1 : -1) * s.propSpin * 42 * dt
    })
    parts.current.tips.forEach((tip, i) => {
      if (!tip) return
      const blink = 0.5 + 0.5 * Math.sin(microTime * (i < 2 ? 5 : 3.2) + i)
      tip.material.emissiveIntensity = 0.3 + blink * 0.7
    })

    // battery only drains once the motors have engaged at least once
    if (s.flightTime > 0) s.battery = Math.max(6, 100 - s.flightTime * 0.14)

    // ---- camera rig: three modes, always eased, never snapped -----------
    const dronePos = groupRef.current ? groupRef.current.position : s.position
    if (cameraMode === 'onboard') {
      const forward = new THREE.Vector3(Math.sin(s.yaw), 0, Math.cos(s.yaw))
      camTarget.current.copy(dronePos).addScaledVector(forward, 0.32).setY(dronePos.y - 0.05)
      camLookAt.current.copy(dronePos).addScaledVector(forward, 6).setY(dronePos.y - 0.15)
    } else if (cameraMode === 'cinematic') {
      const orbit = microTime * 0.06
      camTarget.current.set(
        dronePos.x + Math.cos(orbit) * 4.6,
        dronePos.y + 1.6,
        dronePos.z + Math.sin(orbit) * 4.6,
      )
      camLookAt.current.copy(dronePos)
    } else {
      // follow (default): behind and above, with lag
      const behind = new THREE.Vector3(-Math.sin(s.yaw), 0, -Math.cos(s.yaw))
      camTarget.current.copy(dronePos).addScaledVector(behind, 3.4).add(new THREE.Vector3(0, 1.7, 0))
      camLookAt.current.copy(dronePos).add(new THREE.Vector3(0, 0.2, 0))
    }
    const camLerp = reduced ? 1 : 1 - Math.exp(-3.2 * dt)
    camera.position.lerp(camTarget.current, camLerp)
    const lookAtSmoothed = camera.userData.lookAt || camLookAt.current.clone()
    lookAtSmoothed.lerp(camLookAt.current, camLerp)
    camera.userData.lookAt = lookAtSmoothed
    camera.lookAt(lookAtSmoothed)

    // ---- telemetry: pushed to React at ~6Hz, not 60Hz ---------------------
    telemetryAccum.current += dt
    if (telemetryAccum.current > 0.15) {
      telemetryAccum.current = 0
      const speedMs = Math.hypot(s.velocity.x, s.velocity.z, s.velocity.y)
      let heading = (THREE.MathUtils.radToDeg(s.yaw) % 360 + 360) % 360
      onTelemetry({
        altitude: Math.max(0, s.position.y - GROUND_ALT),
        speed: speedMs,
        heading,
        battery: s.battery,
        flightTime: s.flightTime,
        phase: s.phase,
      })
    }
  })

  return (
    <group ref={groupRef}>
      <DroneModel parts={parts.current} />
    </group>
  )
}

/** Ground, lighting and atmosphere -- kept deliberately simple and cheap. */
export function FlightEnvironment({ bg, ground, line }) {
  const fog = useMemo(() => new THREE.Color(bg), [bg])
  const { scene } = useThree()
  useEffect(() => {
    scene.fog = new THREE.Fog(fog, 6, 22)
    return () => {
      scene.fog = null
    }
  }, [scene, fog])

  return (
    <>
      <hemisphereLight args={[0xffffff, ground, 0.55]} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.1}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={16}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-5, 2, -4]} intensity={0.28} />

      <gridHelper args={[24, 24, line, line]} position={[0, 0.001, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>

      <ContactShadows position={[0, 0.005, 0]} opacity={0.55} scale={6} blur={2.2} far={3} />
    </>
  )
}

export const FLIGHT_LIMITS = { HOVER_ALT, GROUND_ALT, MAX_ALT, MAX_H_SPEED, MAX_V_SPEED }
