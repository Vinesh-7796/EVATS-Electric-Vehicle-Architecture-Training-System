import * as THREE from 'three'

// ─── Dark-mode palette (holographic neon blueprint) ──────────────────────────
export const darkPalette = {
  background:  new THREE.Color('#1a1a1a'),
  fog:         new THREE.Color('#1a1a1a'),
  edge:        new THREE.Color('#00E5FF'),
  edgeOpacity: 0.82,
  occluder:    new THREE.Color('#145f75'),   // glowing holographic blueprint teal/cyan
  occluderOpacity: 0.40,
  grid1:       new THREE.Color('#075C68'),
  grid2:       new THREE.Color('#0C3D46'),
  gridOpacity: 0.32,
  anchor:      new THREE.Color('#00E5FF'),
  fogDensity:  0.038,
}

// ─── Light-mode palette (technical drawing / crisp blueprint) ─────────────────
export const lightPalette = {
  background:  new THREE.Color('#F6F8FA'),
  fog:         new THREE.Color('#EFF4FB'),
  edge:        new THREE.Color('#1E293B'),   // Technical Slate Dark Blue
  edgeOpacity: 0.9,
  occluder:    new THREE.Color('#EFF4FB'),   // soft blue-grey for frosted glass look
  occluderOpacity: 0.38,
  grid1:       new THREE.Color('#CBD5E1'),
  grid2:       new THREE.Color('#E2E8F0'),
  gridOpacity: 0.55,
  anchor:      new THREE.Color('#2563EB'),
  fogDensity:  0.032,
}

export type RenderPalette = typeof darkPalette

// ─── Mesh pattern filters ─────────────────────────────────────────────────────
export const interiorMeshPattern = /(seat|chair|passenger|steering|driver|dashboard|wheel|pedal|column)/i
export const glassMeshPattern    = /(glass|window|windscreen|windshield|pane|transparent)/i

// ─── Material factories ───────────────────────────────────────────────────────

/**
 * Depth pre-pass material — writes to depth buffer, does not write color.
 * Being opaque, it renders first in the opaque pass, setting up the depth profile
 * of the bus to block back-facing edge lines.
 */
export const createDepthPrepassMaterial = () =>
  new THREE.MeshBasicMaterial({
    colorWrite:  false,
    transparent: false,
    depthWrite:  false,
    side:        THREE.DoubleSide,
  })

/**
 * Translucent body material — rendered in the transparent pass.
 * Does not write to depth buffer to avoid sorting/flickering artifacts.
 */
export const createTranslucentBodyMaterial = (palette: RenderPalette) =>
  new THREE.MeshStandardMaterial({
    color:       palette.occluder,
    roughness:   0.8,
    metalness:   0.1,
    transparent: true,
    opacity:     palette.occluderOpacity,
    depthWrite:  false,
    side:        THREE.DoubleSide,
  })

/**
 * Contour edge lines — rendered on top of the occluder.
 * Uses normal alpha blending (not additive) so opacity is perceptually correct
 * against both dark and light backgrounds.
 */
export const createEdgeMaterial = (palette: RenderPalette) =>
  new THREE.LineBasicMaterial({
    color:       palette.edge,
    transparent: true,
    opacity:     palette.edgeOpacity,
    depthWrite:  false,
  })

/**
 * Anchor sphere — small dot marking each subsystem's 3-D anchor point.
 */
export const createAnchorMaterial = (palette: RenderPalette) =>
  new THREE.MeshBasicMaterial({
    color:       palette.anchor,
    transparent: true,
    opacity:     0.9,
    depthWrite:  false,
    blending:    THREE.NormalBlending,
  })

// ─── Legacy disposal helper ───────────────────────────────────────────────────
export const disposeMaterial = (material: THREE.Material | THREE.Material[]) => {
  if (Array.isArray(material)) {
    material.forEach((m) => m.dispose())
    return
  }
  material.dispose()
}
