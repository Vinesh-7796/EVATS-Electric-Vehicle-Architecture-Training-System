import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, CornerDownLeft } from 'lucide-react'
import { useFlowchart } from '../contexts/FlowchartContext'
import { allComponents, flowcharts } from '../data/components'
import type { ComponentDetail, Domain } from '../types'

// Accent colours aligned to the design spec (kept in sync with other components).
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

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ')

// Pre-index each component with a searchable haystack of name + aliases.
type SearchEntry = {
  component: ComponentDetail
  flowchartTitle: string
  haystack: string
}

const searchIndex: SearchEntry[] = allComponents
  .filter(c => !c.isHeading)
  .map(component => {
    const fc = flowcharts.find(f => f.id === component.flowchartId)
    const aliasHay = (component.aliases ?? []).map(normalize).join(' ')
    return {
      component,
      flowchartTitle: fc?.title ?? component.flowchartId,
      haystack: `${normalize(component.name)} ${aliasHay} ${normalize(component.domain)}`,
    }
  })

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setSelectedFlowchart,
    setSelectedComponent,
    setEnlargedImageComponent,
  } = useFlowchart()

  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Cmd/Ctrl+K toggles the palette globally.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // Reset state + focus input whenever the palette opens.
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setActiveIndex(0)
      // Defer focus until after the open animation paints.
      const t = setTimeout(() => inputRef.current?.focus(), 30)
      return () => clearTimeout(t)
    }
  }, [commandPaletteOpen])

  // Filter + rank results: name-prefix matches first, then name-includes, then rest.
  const results = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return []

    const normalizedName = (entry: SearchEntry) => normalize(entry.component.name)
    const hasAliasMatch = (entry: SearchEntry) =>
      (entry.component.aliases ?? []).some(a => normalize(a).includes(q))

    return searchIndex
      .filter(entry => entry.haystack.includes(q))
      .sort((a, b) => {
        const aName = normalizedName(a)
        const bName = normalizedName(b)
        const aNameStarts = aName.startsWith(q)
        const bNameStarts = bName.startsWith(q)
        const aNameIncludes = aName.includes(q)
        const bNameIncludes = bName.includes(q)
        const aAliasHas = hasAliasMatch(a)
        const bAliasHas = hasAliasMatch(b)

        // 1. Name starts with query (highest priority)
        if (aNameStarts && !bNameStarts) return -1
        if (!aNameStarts && bNameStarts) return 1
        // 2. Name contains query
        if (aNameIncludes && !bNameIncludes) return -1
        if (!aNameIncludes && bNameIncludes) return 1
        // 3. Alias contains query
        if (aAliasHas && !bAliasHas) return -1
        if (!aAliasHas && bAliasHas) return 1
        return 0
      })
      .slice(0, 12)
  }, [query])

  // Clamp active index when the result set changes.
  useEffect(() => {
    setActiveIndex(i => Math.min(i, Math.max(0, results.length - 1)))
  }, [results.length])

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-result-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const choose = (entry: SearchEntry | undefined) => {
    if (!entry) return
    const fc = flowcharts.find(f => f.id === entry.component.flowchartId)
    if (fc) setSelectedFlowchart(fc)
    setSelectedComponent(entry.component)
    setEnlargedImageComponent(null)
    setCommandPaletteOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setCommandPaletteOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      choose(results[activeIndex])
    }
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const kbdHint = isMac ? '⌘K' : 'Ctrl K'

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-[#0F172A]/55 dark:bg-black/60 backdrop-blur-sm"
          onClick={() => setCommandPaletteOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search components"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.15 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 border-b border-[#E2E8F0] dark:border-white/10">
              <Search className="w-4 h-4 text-[#64748B] dark:text-[#8a8a8a] flex-shrink-0" strokeWidth={1.75} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={handleKeyDown}
                placeholder="Search components by name or alias…"
                className="flex-1 py-4 bg-transparent text-[15px] text-[#0F172A] dark:text-[#d4d4d4] placeholder:text-[#94A3B8] dark:placeholder:text-[#555] focus:outline-none"
                aria-label="Search components"
                aria-autocomplete="list"
                aria-controls="command-palette-results"
                aria-activedescendant={results[activeIndex] ? `result-${activeIndex}` : undefined}
              />
              <kbd className="hidden sm:inline-flex items-center rounded-md border border-[#E2E8F0] dark:border-white/10 bg-[#F1F5F9] dark:bg-[#252525] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B] dark:text-[#8a8a8a]">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              id="command-palette-results"
              role="listbox"
              className="max-h-[50vh] overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm text-[#64748B] dark:text-[#8a8a8a]">
                    {query.trim() ? 'No components found' : 'Start typing to search components'}
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8] dark:text-[#555]">
                    {query.trim() ? 'Try a different name or alias' : 'Search by name, alias, or domain'}
                  </p>
                </div>
              ) : (
                results.map((entry, i) => {
                  const isActive = i === activeIndex
                  const accent = domainAccentColors[entry.component.domain as Domain] ?? '#64748B'
                  return (
                    <button
                      key={entry.component.id}
                      data-result-index={i}
                      id={`result-${i}`}
                      role="option"
                      aria-selected={isActive}
                      onMouseMove={() => setActiveIndex(i)}
                      onClick={() => choose(entry)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isActive
                          ? 'bg-[#F1F5F9] dark:bg-white/5'
                          : 'hover:bg-[#F8FAFC] dark:hover:bg-white/5'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: accent }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#0F172A] dark:text-[#d4d4d4] truncate">
                          {entry.component.name}
                        </div>
                        <div className="text-xs text-[#64748B] dark:text-[#8a8a8a] truncate">
                          {entry.flowchartTitle} · {entry.component.domain}
                        </div>
                      </div>
                      {isActive && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#94A3B8] dark:text-[#555] flex-shrink-0" strokeWidth={1.75} />
                      )}
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E2E8F0] dark:border-white/10 bg-[#F8FAFC] dark:bg-[#252525]">
              <div className="flex items-center gap-3 text-[11px] text-[#64748B] dark:text-[#8a8a8a]">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-1 py-0.5 text-[10px]">↑</kbd>
                  <kbd className="rounded border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-1 py-0.5 text-[10px]">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-[#E2E8F0] dark:border-white/10 bg-white dark:bg-[#1a1a1a] px-1 py-0.5 text-[10px]">↵</kbd>
                  to select
                </span>
              </div>
              <span className="text-[11px] text-[#94A3B8] dark:text-[#555]">{searchIndex.length} components · {kbdHint}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
