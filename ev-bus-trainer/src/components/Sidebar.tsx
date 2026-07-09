import { motion } from 'framer-motion'
import { Circle } from 'lucide-react'
import { useFlowchart } from '../contexts/FlowchartContext'
import { getComponentsByFlowchart } from '../data/components'
import type { ComponentDetail } from '../types'

// Accent colours aligned to the design spec (kept in sync with Header.tsx).
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

// Convert a hex colour to an "r, g, b" string for rgba() usage.
const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export const Sidebar: React.FC = () => {
  const { selectedFlowchart, selectedComponent, setSelectedComponent, setEnlargedImageComponent } = useFlowchart()

  const components = getComponentsByFlowchart(selectedFlowchart.id).filter(c => !c.isHeading)
  const accentColor = themeAccents[selectedFlowchart.colorTheme] ?? fallbackAccent
  const accentRgb = hexToRgb(accentColor)

  const handleSelect = (component: ComponentDetail | null) => {
    setSelectedComponent(component)
    setEnlargedImageComponent(null)
  }

  // Shared inline style for the active item — a 12% accent tint background.
  const activeStyle = { backgroundColor: `rgba(${accentRgb}, 0.12)` }

  return (
    <motion.nav
      initial={{ width: 240 }}
      animate={{ width: 240 }}
      className="industrial-side-panel flex flex-col h-full border-r border-[#E2E8F0] dark:border-white/10 overflow-y-auto z-10 relative transition-colors"
    >
      <div className="px-5 py-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#64748B] dark:text-[#8a8a8a] mb-4 transition-colors">
          {selectedFlowchart.title}
        </h2>

        <ul className="space-y-1">
          {/* Overview Option */}
          <li>
            <button
              onClick={() => handleSelect(null)}
              style={!selectedComponent ? activeStyle : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm ${
                !selectedComponent
                  ? 'text-[#0F172A] dark:text-[#ff6b35] font-semibold'
                  : 'text-[#475569] dark:text-[#d4d4d4] hover:bg-[#F8FAFC] dark:hover:bg-white/5 font-medium'
              }`}
            >
              {!selectedComponent ? (
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#CBD5E1] dark:text-[#555]" strokeWidth={1.75} />
              )}
              Overview
            </button>
          </li>

          {/* Components List */}
          {components.map((component) => {
            const isSelected = selectedComponent?.id === component.id

            return (
              <li key={component.id}>
                <button
                  onClick={() => handleSelect(component)}
                  style={isSelected ? activeStyle : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors text-sm text-left ${
                    isSelected
                      ? 'text-[#0F172A] dark:text-[#ff6b35] font-semibold'
                      : 'text-[#475569] dark:text-[#d4d4d4] hover:bg-[#F8FAFC] dark:hover:bg-white/5 font-medium'
                  }`}
                >
                  {isSelected ? (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-[#CBD5E1] dark:text-[#555] flex-shrink-0" strokeWidth={1.75} />
                  )}
                  <span className="truncate">{component.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </motion.nav>
  )
}
