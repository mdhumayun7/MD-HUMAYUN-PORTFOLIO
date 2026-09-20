// ===========================================================================
//  WEBGL CAPABILITY CHECK
//  Run before mounting the Canvas -- some devices (old phones, locked-down
//  corporate browsers, some in-app webviews) have no WebGL context at all.
// ===========================================================================
export function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}
