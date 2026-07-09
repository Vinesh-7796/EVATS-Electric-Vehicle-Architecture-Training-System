import { motion } from 'framer-motion'
import { ZoomIn, ZoomOut, X, Play } from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFlowchart } from '../contexts/FlowchartContext'
import { useTheme } from '../contexts/ThemeContext'
import type { ComponentDetail } from '../types'
import { getComponentsByFlowchart } from '../data/components'
import { VideoModal } from './VideoModal'

const isGrayscale = (r: number, g: number, b: number) => {
  return r === g && g === b
}

const parseColor = (colorStr: string): { r: number; g: number; b: number } | null => {
  colorStr = colorStr.trim().toLowerCase()
  if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/)
    if (match) {
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
    }
  } else if (colorStr.startsWith('#')) {
    const hex = colorStr.substring(1)
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16)
      const g = parseInt(hex[1] + hex[1], 16)
      const b = parseInt(hex[2] + hex[2], 16)
      return { r, g, b }
    } else if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return { r, g, b }
    }
  }
  return null
}

const preserveSignalColors = (svg: SVGSVGElement) => {
  svg.querySelectorAll<SVGElement>('path, line, polyline, polygon').forEach((element) => {
    const styleAttr = element.getAttribute('style') || ''
    if (!styleAttr.includes('light-dark')) return

    ;(['stroke', 'fill'] as const).forEach(property => {
      const rawStyle = element.getAttribute('style') || ''
      const propRegex = new RegExp(`${property}:\\s*(light-dark\\((?:[^()]*\\([^()]*\\)\\s*,?\\s*)*\\))`, 'i')
      const styleMatch = rawStyle.match(propRegex)
      if (!styleMatch) return

      const lightDarkValue = styleMatch[1]
      const ldMatch = lightDarkValue.match(/light-dark\(\s*((?:rgb\([^)]*\)|#[0-9a-fA-F]{3,6}|[^,]+))\s*,\s*((?:rgb\([^)]*\)|#[0-9a-fA-F]{3,6}|[^)]+))\s*\)/i)
      if (!ldMatch) return

      const lightColor = ldMatch[1].trim()
      const darkColor = ldMatch[2].trim()

      const lightParsed = parseColor(lightColor)
      const darkParsed = parseColor(darkColor)

      const lightIsGray = lightParsed ? isGrayscale(lightParsed.r, lightParsed.g, lightParsed.b) : true
      const darkIsGray = darkParsed ? isGrayscale(darkParsed.r, darkParsed.g, darkParsed.b) : true

      if (lightIsGray && darkIsGray) return

      const forcedColor = !darkIsGray ? darkColor : lightColor

      element.setAttribute(property, forcedColor)
      const newStyle = rawStyle.replace(
        new RegExp(`${property}:\\s*light-dark\\((?:[^()]*\\([^()]*\\)\\s*,?\\s*)*\\)`, 'i'),
        `${property}: ${forcedColor}`
      )
      element.setAttribute('style', newStyle)
      element.style.setProperty(property, forcedColor, 'important')
    })
  })
}

// Accent colours aligned to the design spec (kept in sync with Header/Sidebar).
const domainAccentColors: Record<string, string> = {
  HV: '#F97316',
  LV: '#2563EB',
  CAN: '#16A34A',
  Thermal: '#0891B2',
  Safety: '#DC2626',
  Control: '#8B5CF6',
  Ground: '#64748B',
  'Hydraulic / Mechanical': '#8B5CF6',
  'Powertrain / Drivetrain': '#F97316',
}

const clearHighlights = (svg: SVGSVGElement) => {
  svg
    .querySelectorAll<SVGRectElement>('.flowchart-component-highlight-selected.is-active')
    .forEach((rect) => rect.classList.remove('is-active'))
}

// Activate every highlight rect belonging to a component. A single component
// can map to multiple SVG cells (e.g. multiple "Modulator Valve" instances on
// the pneumatic chart) — all of them represent the same logical part and must
// highlight together.
const applyHighlights = (svg: SVGSVGElement, componentId: string) => {
  svg
    .querySelectorAll<SVGRectElement>(
      `.flowchart-component-highlight-selected[data-component-id="${componentId}"]`,
    )
    .forEach((rect) => rect.classList.add('is-active'))
}

const createHighlightRect = (
  component: ComponentDetail,
  bounds: { x: string; y: string; width: string; height: string },
) => {
  const padding = 8
  const x = parseFloat(bounds.x)
  const y = parseFloat(bounds.y)
  const width = parseFloat(bounds.width)
  const height = parseFloat(bounds.height)
  const accentColor = domainAccentColors[component.domain] || domainAccentColors.Control
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')

  const totalW = width + padding * 2
  const totalH = height + padding * 2
  const rx = 10

  rect.setAttribute('x', String(x - padding))
  rect.setAttribute('y', String(y - padding))
  rect.setAttribute('width', String(totalW))
  rect.setAttribute('height', String(totalH))
  rect.setAttribute('rx', String(rx))
  rect.setAttribute('ry', String(rx))
  rect.setAttribute('stroke', accentColor)
  rect.setAttribute('stroke-linecap', 'round')
  rect.setAttribute('pointer-events', 'none')
  rect.setAttribute('data-component-id', component.id)
  rect.style.setProperty('color', accentColor)
  rect.classList.add('flowchart-component-highlight', 'flowchart-component-highlight-selected')

  return rect
}

const hasValidBounds = (bounds: { x: string; y: string; width: string; height: string }) => {
  const x = parseFloat(bounds.x)
  const y = parseFloat(bounds.y)
  const width = parseFloat(bounds.width)
  const height = parseFloat(bounds.height)

  return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
}

const getBoundsForGroup = (group: Element, boundary: Element) => {
  const preferredShape = group.querySelector<SVGGraphicsElement>('rect:not([fill="none"][stroke="none"]), path:not([fill="none"][stroke="none"]), ellipse, polygon, image')
  if (preferredShape) {
    try {
      const bounds = getRenderedBounds(preferredShape, boundary)
      if (bounds && hasValidBounds(bounds)) return bounds
    } catch {
      // Continue to text or group bounds.
    }
  }

  // Fall back to drawio's invisible hit-rect (fill="none" stroke="none"
  // pointer-events="all" with explicit numeric dimensions). Some SVGs (e.g.
  // the pneumatic chart) only contain these hit-rects + text in a 100%-width
  // foreignObject, so they are the only reliable bounds source here.
  const drawioHitRect = Array.from(group.querySelectorAll<SVGRectElement>('rect')).find(rect => {
    if (rect.getAttribute('pointer-events') !== 'all') return false
    if (rect.getAttribute('fill') !== 'none' || rect.getAttribute('stroke') !== 'none') return false
    return hasValidBounds({
      x: rect.getAttribute('x') ?? '',
      y: rect.getAttribute('y') ?? '',
      width: rect.getAttribute('width') ?? '',
      height: rect.getAttribute('height') ?? '',
    })
  })
  if (drawioHitRect) {
    try {
      const bounds = getRenderedBounds(drawioHitRect, boundary)
      if (bounds && hasValidBounds(bounds)) return bounds
    } catch {
      // Continue to text or group bounds.
    }
  }

  const svgText = group.querySelector<SVGTextElement>('text')
  if (svgText) {
    try {
      const bounds = getRenderedBounds(svgText, boundary)
      if (bounds && hasValidBounds(bounds)) return bounds
    } catch {
      // Continue to foreignObject or group bounds.
    }
  }

  const foreignObject = group.querySelector<SVGForeignObjectElement>('foreignObject')
  if (foreignObject) {
    try {
      const bounds = getRenderedBounds(foreignObject, boundary)
      if (bounds && hasValidBounds(bounds)) return bounds
    } catch {
      // Continue to group bounds.
    }
  }

  if (group instanceof SVGGraphicsElement) {
    try {
      const bounds = getRenderedBounds(group, boundary)
      if (bounds && hasValidBounds(bounds)) return bounds
    } catch {
      return null
    }
  }

  return null
}

const isContainerGroup = (group: Element) => {
  return Array.from(group.children).some((child) => (
    child instanceof SVGGElement && (child.querySelector('g[data-cell-id]') || child.hasAttribute('data-cell-id'))
  ))
}

const isOversizedHitZone = (svg: SVGSVGElement, bounds: { width: string; height: string }) => {
  const viewBox = svg.viewBox.baseVal
  const svgArea = viewBox.width > 0 && viewBox.height > 0
    ? viewBox.width * viewBox.height
    : svg.clientWidth * svg.clientHeight
  const hitArea = parseFloat(bounds.width) * parseFloat(bounds.height)

  return svgArea > 0 && hitArea > svgArea * 0.45
}

const applyMatrixToPoint = (matrix: SVGMatrix, x: number, y: number) => ({
  x: matrix.a * x + matrix.c * y + matrix.e,
  y: matrix.b * x + matrix.d * y + matrix.f,
})

const getMatrixToBoundary = (element: SVGGraphicsElement, boundary: Element) => {
  const svg = element.ownerSVGElement
  if (!svg) return null

  let matrix = svg.createSVGMatrix()
  let current: Element | null = element

  while (current && current !== boundary) {
    if (current instanceof SVGGraphicsElement) {
      const localMatrix = current.transform.baseVal.consolidate()?.matrix
      if (localMatrix) {
        matrix = localMatrix.multiply(matrix)
      }
    }
    current = current.parentElement
  }

  return matrix
}

const getRenderedBounds = (element: SVGGraphicsElement, boundary: Element) => {
  const bbox = element.getBBox()
  const matrix = getMatrixToBoundary(element, boundary)
  if (!matrix) return null

  const points = [
    applyMatrixToPoint(matrix, bbox.x, bbox.y),
    applyMatrixToPoint(matrix, bbox.x + bbox.width, bbox.y),
    applyMatrixToPoint(matrix, bbox.x, bbox.y + bbox.height),
    applyMatrixToPoint(matrix, bbox.x + bbox.width, bbox.y + bbox.height),
  ]
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    x: String(minX),
    y: String(minY),
    width: String(maxX - minX),
    height: String(maxY - minY),
  }
}

export const FlowchartViewer: React.FC = () => {
  const {
    selectedFlowchart,
    selectedComponent,
    enlargedImageComponent,
    setEnlargedImageComponent,
    setSelectedComponent,
    commandPaletteOpen,
  } = useFlowchart()
  const { theme } = useTheme()
  const components = useMemo(
    () => getComponentsByFlowchart(selectedFlowchart.id),
    [selectedFlowchart.id],
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoOpen, setVideoOpen] = useState(false)

  // Sync SVG highlight when selectedComponent changes externally (e.g. sidebar click,
  // command palette, keyboard navigation).  Direct clicks on the SVG hit zones update
  // the highlight in their own click handler, but all other selection paths go through
  // React state only — so we bridge the gap here.
  useEffect(() => {
    if (!containerRef.current) return
    const svg = containerRef.current.querySelector<SVGSVGElement>('svg')
    if (!svg) return

    clearHighlights(svg)

    if (!selectedComponent) return

    applyHighlights(svg, selectedComponent.id)
  }, [selectedComponent])

  // A3: Escape closes the enlarged image modal.
  useEffect(() => {
    if (!enlargedImageComponent) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEnlargedImageComponent(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enlargedImageComponent, setEnlargedImageComponent])

  // Escape clears selection (deselects the highlighted component) — but not when
  // the command palette is open (palette owns Escape), an image modal is open, or
  // the training video modal is open.
  useEffect(() => {
    if (!selectedComponent || commandPaletteOpen || enlargedImageComponent || videoOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedComponent(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedComponent, commandPaletteOpen, enlargedImageComponent, videoOpen, setSelectedComponent])

  useEffect(() => {
    if (!containerRef.current || !selectedFlowchart.svgFile) return

    const loadSvg = async () => {
      try {
        const response = await fetch(selectedFlowchart.svgFile)
        const svgText = await response.text()
        
        const svgMatch = svgText.match(/<svg[^>]*>[\s\S]*<\/svg>/i)
        if (svgMatch && containerRef.current) {
          containerRef.current.innerHTML = svgMatch[0]
          
          const svg = containerRef.current.querySelector('svg')
          if (!svg) return

          // Apply responsive scaling
          svg.setAttribute('width', '100%')
          svg.setAttribute('height', '100%')
          svg.style.maxWidth = '100%'
          svg.style.maxHeight = '80vh'
          svg.style.width = 'auto'
          svg.style.height = 'auto'
          svg.style.removeProperty('background')
          svg.style.removeProperty('background-color')
          svg.style.setProperty('color-scheme', theme === 'dark' ? 'dark' : 'light')
          svg.classList.add('flowchart-svg')
          preserveSignalColors(svg)

          const hitLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          hitLayer.setAttribute('class', 'flowchart-hit-zones')
          svg.appendChild(hitLayer)

          // Build a map of cell IDs to components
          const cellIdToComponent = new Map<string, ComponentDetail>()
          components.forEach((c: ComponentDetail) => {
            if (c.svgCellIds) {
              c.svgCellIds.forEach(id => cellIdToComponent.set(id, c))
            }
          })

          // Process all mapped groups with data-cell-id
          svg.querySelectorAll('g[data-cell-id]').forEach((group: Element) => {
            const cellId = group.getAttribute('data-cell-id')
            
            // Explicitly ignore known ghost text boxes that shouldn't be clickable
            const ignoredCellIds = new Set([
              'KvX3_2IPjFl1woqNRw4t-13', 'KvX3_2IPjFl1woqNRw4t-14', // HV Aux ghost boxes
              'Xis8ncpvoDD4fyIuJm7I-5', // zero-length edge (invisible hotspot)
              // HV Aux descriptive annotation boxes (labels, not components):
              'Xis8ncpvoDD4fyIuJm7I-14', // "Air Compressor drive HV AC output"
              'Xis8ncpvoDD4fyIuJm7I-15', // "Electric Power Steering HV AC output"
              'Xis8ncpvoDD4fyIuJm7I-18', // "Doors / Air Suspension / Brake air Supply"
              'Xis8ncpvoDD4fyIuJm7I-19', // "Compressed Air"
              'Xis8ncpvoDD4fyIuJm7I-20', // "Mechanical/ Hydraulic Force"
              // HV Power descriptive annotation boxes (labels, not components):
              '3qHOZeVK11j_1dg9K6C2-2', // "6-Phase Traction Inverter" spec callout
              '3qHOZeVK11j_1dg9K6C2-19', // "Dana LSM 200C HV 6-Phase · 3000 A" spec callout
            ])
            if (cellId && ignoredCellIds.has(cellId)) {
              return
            }
            
            let component: ComponentDetail | undefined
            
            if (cellId && cellIdToComponent.has(cellId)) {
              component = cellIdToComponent.get(cellId)
            } else if (!isContainerGroup(group)) {
              // Fallback: match by text content
              let rawText = group.querySelector('foreignObject div')?.textContent
              if (!rawText) {
                rawText = group.querySelector('text')?.textContent
              }
              
              if (rawText) {
                const text = rawText.toLowerCase().replace(/\s+/g, ' ')
                if (text && !text.includes('hv ac') && !text.includes('hv dc') && !text.includes('6-phase') && !text.includes('dana lsm')) {
                  component = components.find((c: ComponentDetail) => {
                    const name = c.name.toLowerCase().replace(/\s+/g, ' ')
                    const aliases = c.aliases?.map(a => a.toLowerCase().replace(/\s+/g, ' ')) || []
                    return text.includes(name) || aliases.some(a => text.includes(a))
                  })
                }
              }
            }
            
            if (!component) return
            if (component.isHeading) return
            
            const bounds = getBoundsForGroup(group, svg)
            if (!bounds || isOversizedHitZone(svg, bounds)) return

            const hitZone = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            hitZone.setAttribute('x', bounds.x)
            hitZone.setAttribute('y', bounds.y)
            hitZone.setAttribute('width', bounds.width)
            hitZone.setAttribute('height', bounds.height)
            hitZone.setAttribute('fill', '#ffffff')
            hitZone.setAttribute('fill-opacity', '0')
            hitZone.setAttribute('stroke', 'none')
            hitZone.setAttribute('pointer-events', 'all')
            hitZone.setAttribute('role', 'button')
            hitZone.setAttribute('aria-label', `Open ${component.name} details`)
            hitZone.style.cursor = 'pointer'

            const selectedHighlight = createHighlightRect(component, bounds)

            const handleClick = () => {
              clearHighlights(svg)
              applyHighlights(svg, component!.id)
              setEnlargedImageComponent(null)
              setSelectedComponent(component!)
            }

            hitZone.addEventListener('click', handleClick)

            hitLayer.appendChild(hitZone)
            hitLayer.appendChild(selectedHighlight)
          })

          // Re-apply highlight if a component was already selected
          // before this SVG loaded (e.g. command palette or sidebar
          // selected a component on a different flowchart).
          if (selectedComponent) {
            applyHighlights(svg, selectedComponent.id)
          }
        }
      } catch (err) {
        console.error('Failed to load SVG:', err)
      }
    }

    loadSvg()
  }, [
    selectedFlowchart.id,
    selectedFlowchart.svgFile,
    components,
    theme,
    setEnlargedImageComponent,
    setSelectedComponent,
  ])

  return (
    <motion.div
      key={selectedFlowchart.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flowchart-stage relative flex flex-col flex-1 overflow-hidden transition-colors"
    >
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <TransformWrapper
          initialScale={1}
          minScale={0.75}
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.008 }}
        >
          {({ zoomIn, zoomOut }) => (
            <>
              {/* Top overlay: Breadcrumbs, Title, Buttons */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between p-6 pointer-events-none">
                <div>
                  <div className="text-[11px] font-medium text-[#64748B] dark:text-[#8a8a8a] mb-1.5 flex items-center gap-2 transition-colors">
                    <span className="font-medium">{selectedFlowchart.title}</span>
                    {selectedComponent && (
                      <>
                        <span className="text-[#CBD5E1] dark:text-[#555] transition-colors">/</span>
                        <span className="text-[#0F172A] dark:text-white font-semibold transition-colors">{selectedComponent.name}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-[22px] font-semibold text-[#0F172A] dark:text-white tracking-[-0.01em] transition-colors">
                    {selectedFlowchart.title}
                  </h2>
                </div>
                <div className="flex gap-2 pointer-events-auto">
                  {selectedFlowchart.videoFile && (
                    <button onClick={() => setVideoOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F97316]/40 dark:border-[#F97316]/30 bg-[#FFF7ED] dark:bg-[#F97316]/10 shadow-none dark:shadow-none text-[#C2410C] dark:text-[#FDBA74] text-xs font-semibold hover:text-[#9A3412] dark:hover:text-white hover:bg-[#FFEDD5] dark:hover:bg-[#F97316]/20 transition-colors" aria-label={`Play ${selectedFlowchart.title} training video`} title="Play training video">
                      <Play className="w-3.5 h-3.5" strokeWidth={2} />
                      Training Video
                    </button>
                  )}
                  <button onClick={() => zoomOut(0.1, 200)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-white/20 bg-white/90 dark:bg-[#252525]/80 shadow-none dark:shadow-none text-[#475569] dark:text-[#d4d4d4] text-xs font-semibold hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors">
                    <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Zoom Out
                  </button>
                  <button onClick={() => zoomIn(0.1, 200)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#CBD5E1] dark:border-white/20 bg-white/90 dark:bg-[#252525]/80 shadow-none dark:shadow-none text-[#475569] dark:text-[#d4d4d4] text-xs font-semibold hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors">
                    <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.75} />
                    Zoom In
                  </button>
                </div>
              </div>

              <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%' }}>
                <div 
                  ref={containerRef} 
                  className={`flowchart-deck flex min-h-full w-full items-center justify-center px-20 ${selectedFlowchart.id === 'can-bus' || selectedFlowchart.id === 'hv-aux' ? 'pt-[calc(4rem+25px)]' : 'pt-[calc(4rem+45px)]'} pb-40`}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>

      {enlargedImageComponent?.image && (
        <div role="dialog" aria-modal="true" aria-label="Enlarged component image" className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F172A]/55 dark:bg-black/60 p-8 backdrop-blur-sm transition-colors">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex max-h-full max-w-full items-center justify-center"
          >
            <button
              type="button"
              onClick={() => setEnlargedImageComponent(null)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/90 dark:bg-black/80 p-2 text-[#0F172A] dark:text-white shadow-sm dark:shadow-none transition hover:bg-white dark:hover:bg-[#252525] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              aria-label="Close enlarged image"
            >
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <img
              src={enlargedImageComponent.image}
              alt={enlargedImageComponent.name}
              className="max-h-[calc(100vh-12rem)] max-w-[calc(100vw-4rem)] rounded-xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1a1a1a] object-contain shadow-2xl lg:max-w-[calc(100vw-32rem)] transition-colors"
            />
          </motion.div>
        </div>
      )}

      {videoOpen && selectedFlowchart.videoFile && (
        <VideoModal
          videoSrc={selectedFlowchart.videoFile}
          title={`${selectedFlowchart.title} — OEM Training`}
          onClose={() => setVideoOpen(false)}
        />
      )}
    </motion.div>
  )
}
