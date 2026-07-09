import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { subsystemAnchors, type SubsystemAnchor } from '../data/subsystemAnchors'
import {
  darkPalette,
  lightPalette,
  type RenderPalette,
  createDepthPrepassMaterial,
  createTranslucentBodyMaterial,
  createEdgeMaterial,
  createAnchorMaterial,
  disposeMaterial,
} from '../graphics/holographicMaterials'

interface ThreeGatewayProps {
  active: boolean
  theme: 'dark' | 'light'
  onSubsystemSelect: (anchor: SubsystemAnchor) => void
}

const hexToRgb = (hex: string) => {
  const value = hex.replace('#', '')
  const r = parseInt(value.substring(0, 2), 16)
  const g = parseInt(value.substring(2, 4), 16)
  const b = parseInt(value.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

const getLineStyle = (anchor: SubsystemAnchor) => {
  const { labelOffset: offset } = anchor
  const lineEndX = offset.x > 0 ? offset.x : offset.x + 178
  const lineEndY = offset.y + 26
  const width = Math.hypot(lineEndX, lineEndY)
  const angle = Math.atan2(lineEndY, lineEndX) * (180 / Math.PI)

  return {
    '--dx': `${offset.x}px`,
    '--dy': `${offset.y}px`,
    '--line-width': `${width}px`,
    '--line-angle': `${angle}deg`,
    '--callout-color': anchor.accentColor,
    '--callout-color-rgb': hexToRgb(anchor.accentColor),
  } as CSSProperties
}

type ProjectedLabel = {
  anchor: SubsystemAnchor
  label: HTMLDivElement
  x: number
  y: number
  visible: boolean
  buttonWidth: number
  buttonHeight: number
  desiredX: number
  desiredY: number
  adjustedX: number
  adjustedY: number
}

const resolveVerticalCollisions = (
  labels: ProjectedLabel[],
  minY: number,
  maxY: number,
) => {
  const sorted = labels.sort((a, b) => a.desiredY - b.desiredY)
  const gap = 12
  let cursor = minY

  sorted.forEach((entry) => {
    entry.adjustedY = Math.max(entry.desiredY, cursor)
    cursor = entry.adjustedY + entry.buttonHeight + gap
  })

  const last = sorted[sorted.length - 1]
  if (!last) return

  const overflow = last.adjustedY + last.buttonHeight - maxY
  if (overflow <= 0) return

  sorted.forEach((entry) => {
    entry.adjustedY -= overflow
  })

  cursor = minY
  sorted.forEach((entry) => {
    entry.adjustedY = Math.max(entry.adjustedY, cursor)
    cursor = entry.adjustedY + entry.buttonHeight + gap
  })
}

// ─── Scene ref bag — everything the theme-switcher needs to retint ────────────
interface SceneRefs {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  anchorMaterial: THREE.MeshBasicMaterial
  occluderMaterials: THREE.MeshStandardMaterial[]
  edgeMaterials: THREE.LineBasicMaterial[]
}

/** Apply a new palette to all live scene objects without rebuilding them. */
const applyPalette = (refs: SceneRefs, palette: RenderPalette) => {
  const { scene, renderer, anchorMaterial, occluderMaterials, edgeMaterials } = refs

  // Fog
  const fog = scene.fog as THREE.FogExp2
  fog.color.copy(palette.fog)
  fog.density = palette.fogDensity

  // Clear colour
  renderer.setClearColor(palette.background, 0)

  // Anchors
  anchorMaterial.color.copy(palette.anchor)

  // Occluder meshes
  occluderMaterials.forEach((m) => {
    m.color.copy(palette.occluder)
    m.opacity = palette.occluderOpacity
  })

  // Edge lines
  edgeMaterials.forEach((m) => {
    m.color.copy(palette.edge)
    m.opacity = palette.edgeOpacity
  })
}

export const ThreeGateway: React.FC<ThreeGatewayProps> = ({ active, theme, onSubsystemSelect }) => {
  const mountRef    = useRef<HTMLDivElement>(null)
  const labelRefs   = useRef(new Map<string, HTMLDivElement>())
  const activeRef   = useRef(active)
  const themeRef    = useRef(theme)
  const sceneRefs   = useRef<SceneRefs | null>(null)

  // Keep refs in sync so animate loop always reads latest values
  useEffect(() => { activeRef.current = active }, [active])

  // Re-tint scene whenever theme changes — no scene rebuild required
  useEffect(() => {
    themeRef.current = theme
    if (!sceneRefs.current) return
    const palette = theme === 'dark' ? darkPalette : lightPalette
    applyPalette(sceneRefs.current, palette)
  }, [theme])

  // ─── One-time scene setup ────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let disposed   = false
    let frameId    = 0
    let modelReady = false

    const initialPalette: RenderPalette = themeRef.current === 'dark' ? darkPalette : lightPalette

    // Scene + fog
    const scene = new THREE.Scene()
    scene.fog   = new THREE.FogExp2(
      initialPalette.fog.getHex(),
      initialPalette.fogDensity,
    )

    // Camera
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100)
    camera.position.set(4.8, 2.7, 6.4)

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias:        true,
      alpha:            true,
      powerPreference:  'high-performance',
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(initialPalette.background, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.sortObjects = true   // required so occluder renders before edges
    mount.appendChild(renderer.domElement)

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping  = true
    controls.dampingFactor  = 0.065
    controls.minDistance    = 3.4
    controls.maxDistance    = 9
    controls.minPolarAngle  = 0.34
    controls.maxPolarAngle  = Math.PI * 0.58
    controls.target.set(0, 0.04, 0)
    controls.update()

    // Neutral lighting that works on both themes — brightness only, no tint
    const ambient  = new THREE.AmbientLight(0xffffff, 1.0)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.6)
    keyLight.position.set(2.2, 4, 3.5)
    scene.add(ambient, keyLight)

    // Model root
    const modelRoot = new THREE.Group()
    modelRoot.name  = 'virtual-bus-blueprint-root'
    scene.add(modelRoot)

    // Anchor spheres
    const anchorGeometry = new THREE.SphereGeometry(0.035, 16, 16)
    const anchorMaterial = createAnchorMaterial(initialPalette)
    subsystemAnchors.forEach((anchor) => {
      const dot = new THREE.Mesh(anchorGeometry, anchorMaterial)
      dot.position.set(anchor.position.x, anchor.position.y, anchor.position.z)
      dot.name        = `anchor-${anchor.id}`
      dot.renderOrder = 10   // always draw on top
      modelRoot.add(dot)
    })

    // Mutable material arrays — filled during model load, used by applyPalette
    const occluderMaterials: THREE.MeshStandardMaterial[] = []
    const edgeMaterials:     THREE.LineBasicMaterial[] = []

    // Expose to theme switcher
    sceneRefs.current = {
      scene,
      renderer,
      anchorMaterial,
      occluderMaterials,
      edgeMaterials,
    }

    // ─── Resize handler ──────────────────────────────────────────────────────
    const sizeRenderer = () => {
      const { width, height } = mount.getBoundingClientRect()
      const safeWidth  = Math.max(1, width)
      const safeHeight = Math.max(1, height)
      renderer.setSize(safeWidth, safeHeight, false)
      camera.aspect = safeWidth / safeHeight
      camera.updateProjectionMatrix()
    }

    // ─── Label projection ────────────────────────────────────────────────────
    const projectLabels = () => {
      const canvasBounds = renderer.domElement.getBoundingClientRect()
      if (!canvasBounds.width || !canvasBounds.height) return
      const projectedLabels: ProjectedLabel[] = []

      subsystemAnchors.forEach((anchor) => {
        const label = labelRefs.current.get(anchor.id)
        if (!label) return
        const button      = label.querySelector<HTMLButtonElement>('.subsystem-label__button')
        const buttonWidth  = button?.offsetWidth  || 188
        const buttonHeight = button?.offsetHeight || 58

        const projected = new THREE.Vector3(anchor.position.x, anchor.position.y, anchor.position.z)
          .applyMatrix4(modelRoot.matrixWorld)
          .project(camera)

        const x        = (projected.x * 0.5 + 0.5) * canvasBounds.width
        const y        = (-(projected.y * 0.5) + 0.5) * canvasBounds.height
        const inFrustum =
          projected.z > -1 && projected.z < 1 &&
          projected.x > -1.18 && projected.x < 1.18 &&
          projected.y > -1.18 && projected.y < 1.18

        label.style.transform    = `translate3d(${x}px, ${y}px, 0)`
        label.style.opacity      = activeRef.current && modelReady && inFrustum ? '1' : '0'
        label.style.pointerEvents = activeRef.current && modelReady && inFrustum ? 'auto' : 'none'

        if (!activeRef.current || !modelReady || !inFrustum) return

        const desiredX        = x + anchor.labelOffset.x
        const desiredY        = y + anchor.labelOffset.y
        const leftColumnMaxX  = canvasBounds.width > 860
          ? canvasBounds.width * 0.48 - buttonWidth
          : canvasBounds.width - buttonWidth - 22
        const rightColumnMinX = canvasBounds.width > 860
          ? canvasBounds.width * 0.52
          : 22
        const clampedX = anchor.labelOffset.x < 0
          ? Math.min(Math.max(22, desiredX), leftColumnMaxX)
          : Math.max(rightColumnMinX, Math.min(canvasBounds.width - buttonWidth - 22, desiredX))

        projectedLabels.push({
          anchor, label, x, y,
          visible: inFrustum,
          buttonWidth, buttonHeight,
          desiredX, desiredY,
          adjustedX: clampedX,
          adjustedY: desiredY,
        })
      })

      const leftSide  = projectedLabels.filter((e) => e.visible && e.anchor.labelOffset.x < 0)
      const rightSide = projectedLabels.filter((e) => e.visible && e.anchor.labelOffset.x >= 0)
      const minY      = Math.max(96, canvasBounds.height * 0.14)
      const maxY      = canvasBounds.height - 34

      resolveVerticalCollisions(leftSide, minY, maxY)
      resolveVerticalCollisions(rightSide, minY, maxY)

      projectedLabels.forEach((entry) => {
        const dx        = entry.adjustedX - entry.x
        const dy        = entry.adjustedY - entry.y
        const lineEndX  = dx < 0 ? dx + entry.buttonWidth : dx
        const lineEndY  = dy + entry.buttonHeight * 0.5
        const width     = Math.hypot(lineEndX, lineEndY)
        const angle     = Math.atan2(lineEndY, lineEndX) * (180 / Math.PI)

        entry.label.style.setProperty('--dx',         `${dx}px`)
        entry.label.style.setProperty('--dy',         `${dy}px`)
        entry.label.style.setProperty('--line-width', `${width}px`)
        entry.label.style.setProperty('--line-angle', `${angle}deg`)
      })
    }

    // ─── Render loop ─────────────────────────────────────────────────────────
    const animate = () => {
      if (disposed) return
      controls.update()
      modelRoot.updateMatrixWorld()
      renderer.render(scene, camera)
      projectLabels()
      frameId = window.requestAnimationFrame(animate)
    }

    sizeRenderer()
    animate()
    window.addEventListener('resize', sizeRenderer)

    // ─── Load GLTF model ─────────────────────────────────────────────────────
    const loader = new GLTFLoader()
    loader.load(
      import.meta.env.BASE_URL + 'bus.glb',
      (gltf) => {
        if (disposed) return

        const busScene  = gltf.scene
        const sourceBox = new THREE.Box3().setFromObject(busScene)
        const sourceSize = sourceBox.getSize(new THREE.Vector3())
        const center     = sourceBox.getCenter(new THREE.Vector3())
        const longestAxis = Math.max(sourceSize.x, sourceSize.y, sourceSize.z)
        const scale       = longestAxis > 0 ? 6.2 / longestAxis : 1
        const lengthRunsOnX = sourceSize.x > sourceSize.z

        busScene.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
        busScene.scale.setScalar(scale)
        if (lengthRunsOnX) busScene.rotation.y = Math.PI / 2

        const activePalette = themeRef.current === 'dark' ? darkPalette : lightPalette

        // ─── Pass 1: Depth pre-pass / Occlusion and contour lines ─────────────
        busScene.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return

          // Depth-only occluder (blocks back-facing lines)
          disposeMaterial(node.material)
          const prepassMat = createDepthPrepassMaterial()
          prepassMat.polygonOffset = true
          prepassMat.polygonOffsetFactor = 1
          prepassMat.polygonOffsetUnits = 1
          node.material = prepassMat
          node.renderOrder = 0
          node.castShadow = false
          node.receiveShadow = false

          // Contour edges
          if (node.geometry) {
            const edgeMat = createEdgeMaterial(activePalette)
            edgeMaterials.push(edgeMat)

            const edges = new THREE.LineSegments(
              new THREE.EdgesGeometry(node.geometry, 15),
              edgeMat,
            )
            edges.name = `${node.name || 'mesh'}-contour-edges`
            edges.renderOrder = 2
            node.add(edges)
          }
        })

        // ─── Pass 2: Clone for translucent body (eliminates sorting bugs) ─────
        const bodyClone = busScene.clone()
        bodyClone.name = 'virtual-bus-translucent-body'

        bodyClone.traverse((node) => {
          if (!(node instanceof THREE.Mesh)) return

          // Remove the contour edges children from this clone
          const edgesChildren = node.children.filter((child) => child.name && child.name.includes('-contour-edges'))
          edgesChildren.forEach((child) => node.remove(child))

          // Assign transparent, depthWrite-disabled material
          const bodyMat = createTranslucentBodyMaterial(activePalette)
          node.material = bodyMat
          node.renderOrder = 1
          occluderMaterials.push(bodyMat)
        })

        modelRoot.add(busScene)
        modelRoot.add(bodyClone)
        modelReady = true
      },
      undefined,
      (error) => {
        console.error('Failed to load bus GLB:', error)
      },
    )

    // ─── Cleanup ─────────────────────────────────────────────────────────────
    return () => {
      disposed = true
      sceneRefs.current = null
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', sizeRenderer)
      controls.dispose()

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) {
          object.geometry?.dispose()
          if ('material' in object) disposeMaterial(object.material)
        }
      })

      anchorGeometry.dispose()
      anchorMaterial.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
      labelRefs.current.clear()
    }
  }, [])   // scene is built once; theme changes go through applyPalette

  return (
    <section className={`three-gateway ${active ? 'is-active' : 'is-prewarming'}`} aria-hidden={!active}>
      <div ref={mountRef} className="three-gateway__canvas" />
      <div className="three-gateway__hud" aria-live="polite">
        <div>
          <h2>Ev Bus System Topology</h2>
        </div>
      </div>
      <div className="three-gateway__labels">
        {subsystemAnchors.map((anchor) => (
          <div
            key={anchor.id}
            ref={(node) => {
              if (node) labelRefs.current.set(anchor.id, node)
              else labelRefs.current.delete(anchor.id)
            }}
            className="subsystem-label"
            style={getLineStyle(anchor)}
          >
            <span className="subsystem-label__dot" />
            <span className="subsystem-label__line" />
            <button
              type="button"
              className="subsystem-label__button"
              onClick={() => onSubsystemSelect(anchor)}
            >
              <span className="subsystem-label__order">{anchor.order}</span>
              {anchor.name}
            </button>
          </div>
        ))}
      </div>

      {/* ── Controls legend ───────────────────────────────────────── */}
      <div className="three-gateway__legend" aria-label="3D controls legend">
        <div className="legend-item">
          <svg className="legend-icon" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="26" height="34" rx="13" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 1 L14 17" stroke="currentColor" strokeWidth="2"/>
            <rect x="1" y="1" width="12" height="17" rx="6" fill="currentColor" fillOpacity="0.35"/>
          </svg>
          <span>Rotate</span>
        </div>
        <div className="legend-item">
          <svg className="legend-icon" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="26" height="34" rx="13" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 1 L14 17" stroke="currentColor" strokeWidth="2"/>
            <rect x="15" y="1" width="12" height="17" rx="6" fill="currentColor" fillOpacity="0.35"/>
          </svg>
          <span>Pan</span>
        </div>
        <div className="legend-item">
          <svg className="legend-icon" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="26" height="34" rx="13" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 1 L14 17" stroke="currentColor" strokeWidth="2"/>
            <circle cx="14" cy="17" r="3.5" fill="currentColor"/>
          </svg>
          <span>Zoom</span>
        </div>
      </div>
      <div className="three-gateway__copyright">
        © 2026 SWITCH Mobility Automotive Ltd. | PROPRIETARY AND CONFIDENTIAL | INTERNAL USE ONLY.
      </div>
    </section>
  )
}
