import { useEffect, useRef } from 'react'

// ===========================================================================
//  INPUT
//  Keyboard and on-screen touch controls write into the SAME mutable ref, so
//  the physics loop (useFrame, which runs outside React's render cycle) has
//  one source of truth regardless of which input method is driving it.
//  Booleans are read every physics tick, not on every keystroke -- holding a
//  key is what should move the drone, not tapping it once.
// ===========================================================================

const KEY_MAP = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  KeyQ: 'yawLeft',
  KeyE: 'yawRight',
  Space: 'up',
  ShiftLeft: 'down',
  ShiftRight: 'down',
}

export function useFlightInput(onTakeoffLand) {
  const input = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
    yawLeft: false,
    yawRight: false,
  })

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.repeat) return
      if (e.code === 'KeyT' || e.code === 'Enter') {
        onTakeoffLand?.()
        return
      }
      const key = KEY_MAP[e.code]
      if (key) {
        input.current[key] = true
        e.preventDefault()
      }
    }
    const handleKeyUp = (e) => {
      const key = KEY_MAP[e.code]
      if (key) input.current[key] = false
    }
    // Lost focus mid-press (alt-tab, etc.) should not leave a key "stuck".
    const clearAll = () => {
      Object.keys(input.current).forEach((k) => (input.current[k] = false))
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', clearAll)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', clearAll)
    }
  }, [onTakeoffLand])

  // Press-and-hold handlers for the on-screen buttons -- bound to pointer
  // events (not click) so a dragged-off touch still releases correctly.
  const bind = (key) => ({
    onPointerDown: (e) => {
      e.preventDefault()
      input.current[key] = true
    },
    onPointerUp: () => {
      input.current[key] = false
    },
    onPointerLeave: () => {
      input.current[key] = false
    },
    onPointerCancel: () => {
      input.current[key] = false
    },
  })

  return { input, bind }
}
