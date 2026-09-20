import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { DroneModel, makePartsRef } from '../DroneModel'

// ===========================================================================
//  BATTLEFIELD SCENE
//
//  A small mission built on the same movement model as the flight-dynamics
//  demo: one player-controlled flagship, three AI swarm-mates that hold a
//  loose formation and close in on hostiles, and five sentry drones that
//  patrol until a friendly agent gets close enough to disable them.
//
//  This is a creative extension for the portfolio, not a replay of the
//  BattleWorld benchmark: the swarm-mate and sentry behaviour below is
//  simple, hand-written steering (separation/cohesion/avoidance plus a pull
//  toward the nearest hostile), not the trained PPO/LLM commander policies
//  from the research. "Neutralise" is a stylised signal-disable effect --
//  the sentry's propellers spin down and it fades out -- there is no combat
//  animation or weapon model of any kind.
// ===========================================================================

const MAX_H_SPEED = 6.4
const MAX_V_SPEED = 2.3
const MAX_YAW_RATE = 1.8
const ACCEL = 11
const DRAG = 2.8
const MAX_TILT = 0.3
const CRUISE_ALT = 2.6
const NEUTRALIZE_RADIUS = 1.15
const TARGET_RADIUS = 1.8
const ARENA_HALF = 13

// Fixed layout so the mission is reasoned-about and repeatable rather than
// randomised on every load -- "synthetic urban scenario" in the same sense
// the dissertation uses the term, here standing in for a small city block.
const BUILDINGS = [
  { x: -4, z: 2, w: 1.6, d: 1.6, h: 2.2 },
  { x: 2.5, z: -1.5, w: 1.4, d: 1.4, h: 3.4 },
  { x: -1.5, z: -4, w: 1.8, d: 1.2, h: 1.8 },
  { x: 5, z: 3.5, w: 1.3, d: 1.3, h: 2.8 },
  { x: -6, z: -3, w: 1.5, d: 1.5, h: 2.4 },
  { x: 0.5, z: 6, w: 1.6, d: 1.6, h: 3.0 },
  { x: -3, z: 7.5, w: 1.2, d: 1.2, h: 2.0 },
  { x: 6.5, z: -4.5, w: 1.4, d: 1.4, h: 2.6 },
]

const TARGET_POS = new THREE.Vector3(0, 0, 11.5)
const FLAGSHIP_START = new THREE.Vector3(0, CRUISE_ALT, -10)

const ENEMY_DEFS = [
  { x: -2.5, z: 3, r: 1.4, speed: 0.5, phase: 0 },
  { x: 3, z: 5.5, r: 1.1, speed: 0.7, phase: 1.4 },
  { x: -1, z: 8, r: 1.3, speed: 0.55, phase: 2.6 },
  { x: 2, z: 9, r: 1.0, speed: 0.65, phase: 4.0 },
  { x: 0, z: 4.5, r: 1.6, speed: 0.45, phase: 5.2 },
]

const SWARM_OFFSETS = [
  new THREE.Vector3(-1.6, 0.1, -1.2),
  new THREE.Vector3(1.6, 0.1, -1.2),
  new THREE.Vector3(0, -0.15, -2.1),
]

function freshFlagship() {
  return {
    position: FLAGSHIP_START.clone(),
    velocity: new THREE.Vector3(),
    yaw: 0,
    pitch: 0,
    roll: 0,
    gimbalPitch: 0,
  }
}

function freshMate(offset) {
  return {
    position: FLAGSHIP_START.clone().add(offset),
    velocity: new THREE.Vector3(),
    pitch: 0,
    roll: 0,
    yaw: 0,
  }
}

function freshEnemy(def) {
  return { ...def, status: 'active', disableT: 0, y: CRUISE_ALT + 0.3 }
}

/** Steers `pos` away from every building it's inside the margin of. Shared by every agent so avoidance behaves identically for the flagship and the AI. */
function avoidBuildings(pos, out, margin = 1.1) {
  BUILDINGS.forEach((b) => {
    const dx = pos.x - b.x
    const dz = pos.z - b.z
    const hx = b.w / 2 + margin
    const hz = b.d / 2 + margin
    if (Math.abs(dx) < hx && Math.abs(dz) < hz) {
      const px = hx - Math.abs(dx)
      const pz = hz - Math.abs(dz)
      if (px < pz) out.x += Math.sign(dx || 1) * (px / hx)
      else out.z += Math.sign(dz || 1) * (pz / hz)
    }
  })
}

export function BattlefieldRig({ inputRef, cameraMode, onMission, reduced }) {
  const flagship = useRef(freshFlagship())
  const mates = useRef(SWARM_OFFSETS.map(freshMate))
  const enemies = useRef(ENEMY_DEFS.map(freshEnemy))
  const pulses = useRef(Array.from({ length: 6 }, () => ({ active: false, life: 0, position: new THREE.Vector3() })))
  const mission = useRef({ status: 'engaging', time: 0, hostilesRemaining: ENEMY_DEFS.length })

  const flagshipParts = useRef(makePartsRef())
  const mateParts = useRef(SWARM_OFFSETS.map(() => makePartsRef()))
  const enemyParts = useRef(ENEMY_DEFS.map(() => makePartsRef()))

  const flagshipGroup = useRef()
  const mateGroups = useRef([])
  const enemyGroups = useRef([])
  const pulseRefs = useRef([])

  const { camera } = useThree()
  const camTarget = useRef(new THREE.Vector3())
  const camLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const telemetryAccum = useRef(0)

  function spawnPulse(position) {
    const p = pulses.current.find((p) => !p.active) || pulses.current[0]
    p.active = true
    p.life = 0
    p.position.copy(position)
  }

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const f = flagship.current
    const input = inputRef.current
    const microTime = performance.now() / 1000

    // ---- flagship: player-controlled, same velocity/drag model as the
    // standalone flight demo, minus the ground/takeoff phase machine since a
    // mission starts already airborne. ---------------------------------
    const forwardVec = new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw))
    const rightVec = new THREE.Vector3(Math.cos(f.yaw), 0, -Math.sin(f.yaw))
    const thrust = new THREE.Vector3()
    if (input.forward) thrust.add(forwardVec)
    if (input.backward) thrust.addScaledVector(forwardVec, -1)
    if (input.right) thrust.add(rightVec)
    if (input.left) thrust.addScaledVector(rightVec, -1)
    if (thrust.lengthSq() > 0) {
      thrust.normalize()
      f.velocity.x += thrust.x * ACCEL * dt
      f.velocity.z += thrust.z * ACCEL * dt
    } else {
      const decay = Math.max(0, 1 - DRAG * dt)
      f.velocity.x *= decay
      f.velocity.z *= decay
    }
    const h = Math.hypot(f.velocity.x, f.velocity.z)
    if (h > MAX_H_SPEED) {
      f.velocity.x = (f.velocity.x / h) * MAX_H_SPEED
      f.velocity.z = (f.velocity.z / h) * MAX_H_SPEED
    }
    const vertIn = (input.up ? 1 : 0) - (input.down ? 1 : 0)
    if (vertIn !== 0) {
      f.velocity.y = THREE.MathUtils.clamp(f.velocity.y + vertIn * ACCEL * 0.7 * dt, -MAX_V_SPEED, MAX_V_SPEED)
    } else {
      f.velocity.y *= Math.max(0, 1 - DRAG * dt)
    }
    f.yaw += ((input.yawRight ? 1 : 0) - (input.yawLeft ? 1 : 0)) * MAX_YAW_RATE * dt

    const avoid = new THREE.Vector3()
    avoidBuildings(f.position, avoid)
    f.velocity.x += avoid.x * 6 * dt
    f.velocity.z += avoid.z * 6 * dt

    f.position.addScaledVector(f.velocity, dt)
    f.position.x = THREE.MathUtils.clamp(f.position.x, -ARENA_HALF, ARENA_HALF)
    f.position.z = THREE.MathUtils.clamp(f.position.z, -ARENA_HALF, ARENA_HALF)
    f.position.y = THREE.MathUtils.clamp(f.position.y, 0.6, 5.5)

    const smooth = 1 - Math.exp(-6 * dt)
    const lf = f.velocity.x * Math.sin(f.yaw) + f.velocity.z * Math.cos(f.yaw)
    const lr = f.velocity.x * Math.cos(f.yaw) - f.velocity.z * Math.sin(f.yaw)
    f.pitch += (THREE.MathUtils.clamp(-(lf / MAX_H_SPEED) * MAX_TILT, -MAX_TILT, MAX_TILT) - f.pitch) * smooth
    f.roll += (THREE.MathUtils.clamp(-(lr / MAX_H_SPEED) * MAX_TILT, -MAX_TILT, MAX_TILT) - f.roll) * smooth
    f.gimbalPitch += (-f.pitch * 0.55 - f.gimbalPitch) * smooth

    if (flagshipGroup.current) {
      flagshipGroup.current.position.copy(f.position)
      flagshipGroup.current.rotation.set(f.roll, f.yaw, -f.pitch, 'YXZ')
    }
    if (flagshipParts.current.gimbal) flagshipParts.current.gimbal.rotation.x = f.gimbalPitch
    flagshipParts.current.props.forEach((p, i) => { if (p) p.rotation.y += (i % 2 === 0 ? 1 : -1) * 42 * dt })

    // ---- nearest active hostile, shared by every friendly agent's steering
    const activeEnemies = enemies.current.filter((e) => e.status === 'active')
    let nearestEnemy = null
    let nearestDist = Infinity
    activeEnemies.forEach((e) => {
      const d = Math.hypot(e.x - f.position.x, e.z - f.position.z)
      if (d < nearestDist) { nearestDist = d; nearestEnemy = e }
    })

    // ---- swarm-mates: loose formation + mild pull toward the nearest
    // hostile once one is within detection range, so the swarm visibly
    // converges on threats rather than only trailing the flagship. --------
    mates.current.forEach((m, i) => {
      const desired = FLAGSHIP_START.clone()
      const worldOffset = SWARM_OFFSETS[i].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), f.yaw)
      desired.copy(f.position).add(worldOffset)

      const toDesired = desired.clone().sub(m.position)
      const steer = new THREE.Vector3(toDesired.x, 0, toDesired.z)
      if (steer.lengthSq() > 0.0001) steer.normalize()

      if (nearestEnemy && nearestDist < 6) {
        const toEnemy = new THREE.Vector3(nearestEnemy.x - m.position.x, 0, nearestEnemy.z - m.position.z)
        const d = toEnemy.length()
        if (d > NEUTRALIZE_RADIUS * 0.8) {
          toEnemy.normalize()
          steer.addScaledVector(toEnemy, 0.85)
        }
        if (d < NEUTRALIZE_RADIUS) {
          nearestEnemy.status = 'disabling'
          nearestEnemy.disableT = 0
          spawnPulse(new THREE.Vector3(nearestEnemy.x, nearestEnemy.y, nearestEnemy.z))
        }
      }

      // separation from other mates
      mates.current.forEach((other, j) => {
        if (i === j) return
        const d = m.position.distanceTo(other.position)
        if (d < 1.1 && d > 0.001) {
          steer.x += (m.position.x - other.position.x) / d * 0.5
          steer.z += (m.position.z - other.position.z) / d * 0.5
        }
      })

      const buildingPush = new THREE.Vector3()
      avoidBuildings(m.position, buildingPush)
      steer.x += buildingPush.x * 1.5
      steer.z += buildingPush.z * 1.5

      if (steer.lengthSq() > 1) steer.normalize()
      m.velocity.x += steer.x * ACCEL * 0.75 * dt
      m.velocity.z += steer.z * ACCEL * 0.75 * dt
      m.velocity.x *= 0.94
      m.velocity.z *= 0.94
      const mh = Math.hypot(m.velocity.x, m.velocity.z)
      if (mh > MAX_H_SPEED * 0.9) {
        m.velocity.x = (m.velocity.x / mh) * MAX_H_SPEED * 0.9
        m.velocity.z = (m.velocity.z / mh) * MAX_H_SPEED * 0.9
      }
      m.velocity.y += (desired.y - m.position.y) * 1.6 * dt
      m.position.addScaledVector(m.velocity, dt)

      m.yaw = Math.atan2(m.velocity.x, m.velocity.z) || m.yaw
      const targetPitch = THREE.MathUtils.clamp(-m.velocity.z * 0.05, -MAX_TILT, MAX_TILT)
      const targetRoll = THREE.MathUtils.clamp(m.velocity.x * 0.05, -MAX_TILT, MAX_TILT)
      m.pitch += (targetPitch - m.pitch) * smooth
      m.roll += (targetRoll - m.roll) * smooth

      const grp = mateGroups.current[i]
      if (grp) {
        grp.position.copy(m.position)
        grp.rotation.set(m.roll, m.yaw, -m.pitch, 'YXZ')
      }
      mateParts.current[i].props.forEach((p, k) => { if (p) p.rotation.y += (k % 2 === 0 ? 1 : -1) * 42 * dt })
    })

    // ---- sentries: idle patrol, or disabling/fading once neutralised ----
    enemies.current.forEach((e, i) => {
      const parts = enemyParts.current[i]
      const grp = enemyGroups.current[i]
      if (e.status === 'active') {
        const t = microTime * e.speed + e.phase
        e.x = ENEMY_DEFS[i].x + Math.cos(t) * e.r
        e.z = ENEMY_DEFS[i].z + Math.sin(t) * e.r
        e.y = CRUISE_ALT + 0.3 + Math.sin(t * 2) * 0.15
        if (grp) {
          grp.position.set(e.x, e.y, e.z)
          grp.rotation.y = t + Math.PI / 2
          grp.visible = true
          grp.scale.setScalar(0.85)
        }
        parts.props.forEach((p, k) => { if (p) p.rotation.y += (k % 2 === 0 ? -1 : 1) * 30 * dt })
      } else if (e.status === 'disabling') {
        e.disableT += dt
        const k = Math.min(1, e.disableT / 1.1)
        e.y -= dt * 0.9
        if (grp) {
          grp.position.set(e.x, e.y, e.z)
          grp.scale.setScalar(0.85 * (1 - k * 0.3))
        }
        parts.props.forEach((p) => { if (p) p.rotation.y += 42 * (1 - k) * dt })
        parts.tips.forEach((tip) => { if (tip?.material) tip.material.opacity = 1 - k })
        if (grp) grp.traverse((o) => { if (o.material && o.material.transparent !== undefined) { o.material.transparent = true; o.material.opacity = 1 - k } })
        if (k >= 1) {
          e.status = 'gone'
          if (grp) grp.visible = false
        }
      } else if (grp) {
        grp.visible = false
      }
    })

    // ---- neutralise pulses ----------------------------------------------
    pulses.current.forEach((p, i) => {
      if (!p.active) return
      p.life += dt
      const ref = pulseRefs.current[i]
      const k = p.life / 0.6
      if (ref) {
        ref.position.copy(p.position)
        ref.scale.setScalar(0.3 + k * 2.2)
        ref.material.opacity = Math.max(0, 0.8 * (1 - k))
        ref.visible = true
      }
      if (k >= 1) {
        p.active = false
        if (ref) ref.visible = false
      }
    })

    // ---- mission state -----------------------------------------------------
    const remaining = enemies.current.filter((e) => e.status !== 'gone').length
    const m = mission.current
    if (m.status !== 'complete') m.time += dt
    m.hostilesRemaining = remaining
    if (remaining === 0) {
      const distToTarget = f.position.distanceTo(TARGET_POS)
      m.status = distToTarget < TARGET_RADIUS ? 'complete' : 'en-route'
    }

    // ---- camera: follow / onboard / cinematic / tactical -----------------
    if (cameraMode === 'onboard') {
      const fwd = new THREE.Vector3(Math.sin(f.yaw), 0, Math.cos(f.yaw))
      camTarget.current.copy(f.position).addScaledVector(fwd, 0.32).setY(f.position.y - 0.05)
      camLookAt.current.copy(f.position).addScaledVector(fwd, 6).setY(f.position.y - 0.15)
    } else if (cameraMode === 'cinematic') {
      const orbit = microTime * 0.05
      camTarget.current.set(f.position.x + Math.cos(orbit) * 5.5, f.position.y + 2, f.position.z + Math.sin(orbit) * 5.5)
      camLookAt.current.copy(f.position)
    } else if (cameraMode === 'tactical') {
      camTarget.current.set(0, 19, 3)
      camLookAt.current.set(0, 0, 2)
    } else {
      const behind = new THREE.Vector3(-Math.sin(f.yaw), 0, -Math.cos(f.yaw))
      camTarget.current.copy(f.position).addScaledVector(behind, 3.6).add(new THREE.Vector3(0, 1.8, 0))
      camLookAt.current.copy(f.position).add(new THREE.Vector3(0, 0.2, 0))
    }
    const camLerp = reduced ? 1 : 1 - Math.exp(-3 * dt)
    camera.position.lerp(camTarget.current, camLerp)
    const smoothedLookAt = camera.userData.battlefieldLookAt || camLookAt.current.clone()
    smoothedLookAt.lerp(camLookAt.current, camLerp)
    camera.userData.battlefieldLookAt = smoothedLookAt
    camera.lookAt(smoothedLookAt)

    // ---- telemetry, throttled --------------------------------------------
    telemetryAccum.current += dt
    if (telemetryAccum.current > 0.15) {
      telemetryAccum.current = 0
      onMission({
        status: m.status,
        time: m.time,
        hostilesRemaining: remaining,
        hostilesTotal: ENEMY_DEFS.length,
      })
    }
  })

  return (
    <>
      {/* ---- arena: ground, buildings, target beacon --------------------- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[ARENA_HALF * 2 + 6, ARENA_HALF * 2 + 6]} />
        <meshStandardMaterial color="#14161a" roughness={1} />
      </mesh>
      <gridHelper args={[ARENA_HALF * 2, 28, '#2a2f34', '#2a2f34']} position={[0, 0.005, 0]} />

      {BUILDINGS.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color="#1c2024" roughness={0.85} />
        </mesh>
      ))}

      <group position={TARGET_POS}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[TARGET_RADIUS - 0.08, TARGET_RADIUS, 48]} />
          <meshBasicMaterial color="#45b3aa" transparent opacity={0.7} />
        </mesh>
        <mesh position={[0, 2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 4, 8]} />
          <meshBasicMaterial color="#45b3aa" transparent opacity={0.35} />
        </mesh>
      </group>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={30} blur={2.5} far={4} />
      <hemisphereLight args={[0xffffff, '#101214', 0.6]} />
      <directionalLight position={[6, 10, 4]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1} shadow-camera-far={30}
        shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} />
      <directionalLight position={[-6, 3, -6]} intensity={0.25} />

      {/* ---- flagship ------------------------------------------------------ */}
      <group ref={flagshipGroup}>
        <DroneModel parts={flagshipParts.current} />
      </group>

      {/* ---- swarm-mates ---------------------------------------------------- */}
      {SWARM_OFFSETS.map((_, i) => (
        <group key={i} ref={(el) => (mateGroups.current[i] = el)} scale={0.78}>
          <DroneModel parts={mateParts.current[i]} />
        </group>
      ))}

      {/* ---- sentries -------------------------------------------------------- */}
      {ENEMY_DEFS.map((_, i) => (
        <group key={i} ref={(el) => (enemyGroups.current[i] = el)}>
          <DroneModel parts={enemyParts.current[i]} accentColor="#e5484d" />
        </group>
      ))}

      {/* ---- neutralise pulses ------------------------------------------------ */}
      {pulses.current.map((_, i) => (
        <mesh key={i} ref={(el) => (pulseRefs.current[i] = el)} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
          <ringGeometry args={[0.85, 1, 32]} />
          <meshBasicMaterial color="#6be0d4" transparent opacity={0} />
        </mesh>
      ))}
    </>
  )
}

export const BATTLEFIELD_CONSTANTS = { TARGET_POS, FLAGSHIP_START }
