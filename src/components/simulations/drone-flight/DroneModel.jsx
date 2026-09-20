import { useMemo } from 'react'
import * as THREE from 'three'

// ===========================================================================
//  DRONE MODEL -- procedural geometry, no external asset.
//
//  Built from primitives rather than an imported GLTF: it keeps the demo
//  dependency-free (no model file to host or fail to load) and keeps every
//  part individually addressable, which is what lets propellers spin and the
//  gimbal counter-rotate independently of the body.
//
//  `parts` is a plain mutable object the parent creates once with useRef;
//  this component fills it in via ref callbacks so the physics loop
//  (DroneRig's useFrame) can drive each part directly without React
//  re-rendering on every animation frame -- the standard R3F performance
//  pattern for anything that moves every tick.
// ===========================================================================

const ARM_ANGLES = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4]
const ARM_LENGTH = 0.62

export function DroneModel({ parts, accentColor = '#45b3aa' }) {
  const armPositions = useMemo(
    () =>
      ARM_ANGLES.map((a) => ({
        angle: a,
        x: Math.cos(a) * ARM_LENGTH,
        z: Math.sin(a) * ARM_LENGTH,
      })),
    [],
  )

  return (
    <group ref={(el) => (parts.body = el)}>
      {/* ---- central body -------------------------------------------- */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <boxGeometry args={[0.5, 0.14, 0.5]} />
        <meshStandardMaterial color="#1c1e21" roughness={0.45} metalness={0.35} />
      </mesh>
      {/* accent stripe -- the one place the drone borrows the site's own
          accent colour, so it reads as "this person's" rather than generic */}
      <mesh position={[0, 0.071, 0]}>
        <boxGeometry args={[0.5, 0.001, 0.08]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>

      {/* ---- gimbal: pitches opposite the body to look stabilised ----- */}
      <group ref={(el) => (parts.gimbal = el)} position={[0, -0.09, 0.2]}>
        <mesh castShadow>
          <boxGeometry args={[0.1, 0.06, 0.06]} />
          <meshStandardMaterial color="#0d0e10" roughness={0.3} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.045]}>
          <cylinderGeometry args={[0.028, 0.028, 0.03, 16]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#050506" roughness={0.1} metalness={0.8} />
        </mesh>
      </group>

      {/* ---- four arms, motors and propellers -------------------------- */}
      {armPositions.map((p, i) => (
        <group key={i}>
          <mesh
            castShadow
            position={[p.x / 2, 0, p.z / 2]}
            rotation={[0, -p.angle, 0]}
          >
            <boxGeometry args={[ARM_LENGTH, 0.045, 0.06]} />
            <meshStandardMaterial color="#2a2d31" roughness={0.55} metalness={0.25} />
          </mesh>

          <mesh castShadow position={[p.x, 0.02, p.z]}>
            <cylinderGeometry args={[0.06, 0.07, 0.08, 16]} />
            <meshStandardMaterial color="#141517" roughness={0.4} metalness={0.4} />
          </mesh>

          {/* propeller -- its own group so it can spin on local Y without
              touching the motor housing beneath it */}
          <group ref={(el) => (parts.props[i] = el)} position={[p.x, 0.07, p.z]}>
            <mesh castShadow>
              <boxGeometry args={[0.36, 0.008, 0.028]} />
              <meshStandardMaterial color="#3a3d42" roughness={0.3} metalness={0.2} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
              <boxGeometry args={[0.36, 0.008, 0.028]} />
              <meshStandardMaterial color="#3a3d42" roughness={0.3} metalness={0.2} />
            </mesh>
          </group>

          {/* tip strobe -- front two lean toward the accent colour, rear two
              a warm red, matching real quadcopter navigation-light colour
              convention (a small, cheap realism cue) */}
          <mesh position={[p.x, 0.03, p.z]} ref={(el) => parts.tips.push(el)}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshStandardMaterial
              color={i < 2 ? accentColor : '#e5484d'}
              emissive={i < 2 ? accentColor : '#e5484d'}
              emissiveIntensity={0.8}
            />
          </mesh>
        </group>
      ))}

      {/* landing skids -- small detail, and gives the shadow a believable
          contact point rather than the body floating flush with the ground */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, -0.13, side * 0.28]} castShadow>
          <boxGeometry args={[0.42, 0.02, 0.02]} />
          <meshStandardMaterial color="#111214" roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

/** Fresh, empty parts container -- create once per mount with useRef(makePartsRef()). */
export function makePartsRef() {
  return { body: null, gimbal: null, props: [null, null, null, null], tips: [] }
}

export const DRONE_CONSTANTS = { ARM_LENGTH }
