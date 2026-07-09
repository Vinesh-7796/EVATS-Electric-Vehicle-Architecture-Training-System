import { createContext, useContext, useEffect, useState } from 'react'
import type { ComponentDetail, FlowchartInfo } from '../types'
import { flowcharts } from '../data/components'

const MAX_RECENT = 5

interface FlowchartContextValue {
  selectedFlowchart: FlowchartInfo
  setSelectedFlowchart: (flowchart: FlowchartInfo) => void
  selectedComponent: ComponentDetail | null
  setSelectedComponent: (component: ComponentDetail | null) => void
  enlargedImageComponent: ComponentDetail | null
  setEnlargedImageComponent: (component: ComponentDetail | null) => void
  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  recentComponents: ComponentDetail[]
  infoModalOpen: boolean
  setInfoModalOpen: (open: boolean) => void
}

const FlowchartContext = createContext<FlowchartContextValue | null>(null)

export const useFlowchart = () => {
  const ctx = useContext(FlowchartContext)
  if (!ctx) throw new Error('useFlowchart must be used within FlowchartProvider')
  return ctx
}

export const FlowchartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedFlowchart, setSelectedFlowchart] = useState<FlowchartInfo>(flowcharts[0])
  const [selectedComponent, setSelectedComponent] = useState<ComponentDetail | null>(null)
  const [enlargedImageComponent, setEnlargedImageComponent] = useState<ComponentDetail | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [recentComponents, setRecentComponents] = useState<ComponentDetail[]>([])

  // Track recently selected components (deduped, most-recent-first, capped).
  useEffect(() => {
    if (!selectedComponent) return
    setRecentComponents(prev => {
      const filtered = prev.filter(c => c.id !== selectedComponent.id)
      return [selectedComponent, ...filtered].slice(0, MAX_RECENT)
    })
  }, [selectedComponent])

  return (
    <FlowchartContext.Provider value={{
      selectedFlowchart,
      setSelectedFlowchart,
      selectedComponent,
      setSelectedComponent,
      enlargedImageComponent,
      setEnlargedImageComponent,
      commandPaletteOpen,
      setCommandPaletteOpen,
      recentComponents,
      infoModalOpen,
      setInfoModalOpen,
    }}>
      {children}
    </FlowchartContext.Provider>
  )
}
