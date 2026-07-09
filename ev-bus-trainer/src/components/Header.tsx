import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Moon, Sun, Info } from 'lucide-react'
import { useFlowchart } from '../contexts/FlowchartContext'
import { useTheme } from '../contexts/ThemeContext'
import { flowcharts } from '../data/components'
import type { FlowchartInfo } from '../types'

// Accent colours aligned to the design spec.
const themeAccents: Record<string, string> = {
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
const fallbackAccent = themeAccents.Control

interface HeaderProps {
  navigationSlot?: React.ReactNode
}

export const Header: React.FC<HeaderProps> = ({ navigationSlot }) => {
  const { selectedFlowchart, setSelectedFlowchart, setSelectedComponent, setEnlargedImageComponent, setCommandPaletteOpen, setInfoModalOpen } = useFlowchart()
  const { theme, toggleTheme } = useTheme()

  const handleSelect = (flowchart: FlowchartInfo) => {
    setSelectedFlowchart(flowchart)
    setSelectedComponent(null)
    setEnlargedImageComponent(null)
  }

  // A3: Arrow keys navigate flowchart tabs (when not typing in an input).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const idx = flowcharts.findIndex(f => f.id === selectedFlowchart.id)
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % flowcharts.length
          : (idx - 1 + flowcharts.length) % flowcharts.length
        handleSelect(flowcharts[next])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedFlowchart.id])

  return (
    <header className="industrial-header flex h-14 items-center justify-between px-6 relative z-10 transition-colors">
      <div className="flex items-center h-full">
        {navigationSlot && (
          <div className="header-nav-slot">
            {navigationSlot}
          </div>
        )}

        {/* Flowchart Tabs */}
        <nav className="flex h-full gap-1">
          {flowcharts.map((flowchart: FlowchartInfo) => {
            const isSelected = selectedFlowchart.id === flowchart.id
            const accentColor = themeAccents[flowchart.colorTheme] ?? fallbackAccent

            // Extract a short name for the tab (e.g. "HV power system" -> "HV Power")
            let shortName = flowchart.title
            if (shortName.toLowerCase().includes('hv power')) shortName = 'HV Power'
            else if (shortName.toLowerCase().includes('lv power')) shortName = 'LV Power'
            else if (shortName.toLowerCase().includes('can bus')) shortName = 'CAN Bus'
            else if (shortName.toLowerCase().includes('hv aux')) shortName = 'HV Aux'
            else if (shortName.toLowerCase().includes('regenerative')) shortName = 'Regen Braking'
            else if (shortName.toLowerCase().includes('pneumatic')) shortName = 'Pneumatics'

            return (
              <button
                key={flowchart.id}
                onClick={() => handleSelect(flowchart)}
                className={`relative flex items-center gap-2 px-3.5 h-full text-[13px] transition-colors ${
                  isSelected
                    ? 'text-[#0F172A] dark:text-white font-semibold'
                    : 'text-[#64748B] dark:text-[#8a8a8a] hover:text-[#0F172A] dark:hover:text-[#d4d4d4] font-medium'
                }`}
                aria-current={isSelected ? 'page' : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full transition-opacity"
                  style={{ backgroundColor: accentColor, opacity: isSelected ? 1 : 0.5 }}
                />
                <span>{shortName}</span>
                {isSelected && (
                  <motion.div
                    layoutId="header-active-tab"
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => setCommandPaletteOpen(true)} className="flex items-center justify-center w-8 h-8 text-[#64748B] dark:text-[#8a8a8a] hover:text-[#0F172A] dark:hover:text-white rounded-lg border border-[#CBD5E1] dark:border-white/5 bg-white dark:bg-[#252525] hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors" aria-label="Search components (⌘K)">
          <Search className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button onClick={() => setInfoModalOpen(true)} className="flex items-center justify-center w-8 h-8 text-[#64748B] dark:text-[#8a8a8a] hover:text-[#0F172A] dark:hover:text-white rounded-lg border border-[#CBD5E1] dark:border-white/5 bg-white dark:bg-[#252525] hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors" aria-label="System Info" title="System Info">
          <Info className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button onClick={toggleTheme} className="flex items-center justify-center w-8 h-8 text-[#64748B] dark:text-[#8a8a8a] hover:text-[#0F172A] dark:hover:text-white rounded-lg border border-[#CBD5E1] dark:border-white/5 bg-white dark:bg-[#252525] hover:bg-[#F8FAFC] dark:hover:bg-white/10 transition-colors" aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.75} /> : <Moon className="w-4 h-4" strokeWidth={1.75} />}
        </button>
      </div>
    </header>
  )
}
