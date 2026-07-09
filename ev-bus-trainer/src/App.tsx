import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Home, Moon, Sun, Info } from 'lucide-react'
import { FlowchartProvider } from './contexts/FlowchartContext'
import { useFlowchart } from './contexts/FlowchartContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useTheme } from './contexts/ThemeContext'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { FlowchartViewer } from './components/FlowchartViewer'
import { DetailPanel } from './components/DetailPanel'
import { CommandPalette } from './components/CommandPalette'
import { ThreeGateway } from './components/ThreeGateway'
import { SystemInfoModal } from './components/SystemInfoModal'
import { flowcharts, getComponentById } from './data/components'
import type { SubsystemAnchor } from './data/subsystemAnchors'

type AppState = 'SPLASH' | 'INTERACTIVE_3D' | 'FLOWCHART_VIEWER'

type AppRoute = {
  state: AppState
  flowchartId?: string
  componentId?: string
}

interface NavigationControlsProps {
  appState: AppState
  canGoBack: boolean
  canGoForward: boolean
  onHome: () => void
  onBack: () => void
  onForward: () => void
  placement?: 'overlay' | 'header'
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  appState,
  canGoBack,
  canGoForward,
  onHome,
  onBack,
  onForward,
  placement = 'overlay',
}) => (
  <div className={`app-nav-controls app-nav-controls--${placement}`} aria-label="Navigation controls">
    <button
      type="button"
      className="app-nav-controls__button"
      onClick={onHome}
      disabled={appState === 'SPLASH'}
      aria-label="Home"
      title="Home"
    >
      <Home className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
    </button>
    <button
      type="button"
      className="app-nav-controls__button"
      onClick={onBack}
      disabled={!canGoBack}
      aria-label="Back"
      title="Back"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
    </button>
    <button
      type="button"
      className="app-nav-controls__button"
      onClick={onForward}
      disabled={!canGoForward}
      aria-label="Forward"
      title="Forward"
    >
      <ArrowRight className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
    </button>
  </div>
)

interface FlowchartShellProps {
  navigationSlot?: React.ReactNode
}

const FlowchartShell: React.FC<FlowchartShellProps> = ({ navigationSlot }) => (
  <div className="flex flex-col h-full app-shell text-[#0F172A] dark:text-[#d4d4d4]">
    <Header navigationSlot={navigationSlot} />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        <FlowchartViewer />
        <DetailPanel />
      </main>
    </div>
  </div>
)

const AppExperience: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('SPLASH')
  const [splashLeaving, setSplashLeaving] = useState(false)
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([{ state: 'SPLASH' }])
  const [routeIndex, setRouteIndex] = useState(0)
  const { setSelectedFlowchart, setSelectedComponent, setEnlargedImageComponent, setInfoModalOpen } = useFlowchart()
  const { theme, toggleTheme } = useTheme()

  const applyRoute = useCallback((route: AppRoute) => {
    setSplashLeaving(false)

    if (route.state === 'FLOWCHART_VIEWER') {
      const targetFlowchart = flowcharts.find((flowchart) => flowchart.id === route.flowchartId) ?? flowcharts[0]
      const targetComponent = route.componentId ? getComponentById(route.componentId) : undefined

      setSelectedFlowchart(targetFlowchart)
      setSelectedComponent(targetComponent ?? null)
      setEnlargedImageComponent(null)
    }

    setAppState(route.state)
  }, [setEnlargedImageComponent, setSelectedComponent, setSelectedFlowchart])

  const navigateTo = useCallback((route: AppRoute) => {
    setRouteHistory((history) => {
      const nextHistory = [...history.slice(0, routeIndex + 1), route]
      setRouteIndex(nextHistory.length - 1)
      return nextHistory
    })
    applyRoute(route)
  }, [applyRoute, routeIndex])

  const beginGateway = useCallback(() => {
    if (appState !== 'SPLASH' || splashLeaving) return
    setSplashLeaving(true)
    window.setTimeout(() => navigateTo({ state: 'INTERACTIVE_3D' }), 560)
  }, [appState, navigateTo, splashLeaving])

  useEffect(() => {
    if (appState !== 'SPLASH') return

    const handleStart = (event: Event) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.app-nav-controls')) return
      if (target?.closest('.app-persistent-nav')) return
      beginGateway()
    }
    window.addEventListener('keydown', handleStart)
    window.addEventListener('pointerdown', handleStart)
    window.addEventListener('touchstart', handleStart, { passive: true })

    return () => {
      window.removeEventListener('keydown', handleStart)
      window.removeEventListener('pointerdown', handleStart)
      window.removeEventListener('touchstart', handleStart)
    }
  }, [appState, beginGateway])

  const handleSubsystemSelect = (anchor: SubsystemAnchor) => {
    // Navigate to the flowchart overview only — no specific component
    navigateTo({
      state: 'FLOWCHART_VIEWER',
      flowchartId: anchor.flowchartId,
    })
  }

  const goHome = () => {
    navigateTo({ state: 'SPLASH' })
  }

  const goBack = () => {
    if (routeIndex <= 0) return
    const nextIndex = routeIndex - 1
    setRouteIndex(nextIndex)
    applyRoute(routeHistory[nextIndex])
  }

  const goForward = () => {
    if (routeIndex >= routeHistory.length - 1) return
    const nextIndex = routeIndex + 1
    setRouteIndex(nextIndex)
    applyRoute(routeHistory[nextIndex])
  }

  const canGoBack = routeIndex > 0
  const canGoForward = routeIndex < routeHistory.length - 1
  const showNavigationControls = true
  const navigationControls = (
    <NavigationControls
      appState={appState}
      canGoBack={canGoBack}
      canGoForward={canGoForward}
      onHome={goHome}
      onBack={goBack}
      onForward={goForward}
      placement="header"
    />
  )

  return (
    <div className="relative h-full overflow-hidden flex flex-col">
      {/* Permanent top nav bar — shown on Splash and 3D screens */}
      {appState !== 'FLOWCHART_VIEWER' && (
        <div className="app-persistent-nav">
          {showNavigationControls && navigationControls}
          <div className="app-persistent-nav__right flex items-center gap-2">
            <button
              type="button"
              className="app-persistent-nav__theme-toggle"
              onClick={() => setInfoModalOpen(true)}
              aria-label="System Info"
              title="System Info"
            >
              <Info className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="app-persistent-nav__theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark'
                ? <Sun className="w-4 h-4" strokeWidth={1.75} />
                : <Moon className="w-4 h-4" strokeWidth={1.75} />}
            </button>
          </div>
        </div>
      )}

      <div className="relative flex-1 overflow-hidden">
        {(appState === 'SPLASH' || appState === 'INTERACTIVE_3D') && (
          <ThreeGateway
            active={appState === 'INTERACTIVE_3D'}
            theme={theme}
            onSubsystemSelect={handleSubsystemSelect}
          />
        )}

        {appState === 'SPLASH' && (
          <button
            type="button"
            className={`splash-screen ${splashLeaving ? 'is-leaving' : ''}`}
            onClick={beginGateway}
          >
            <span className="splash-screen__eyebrow">Technical Training Console</span>
            <span className="splash-screen__title">Electric Vehicle Architecture Training System</span>
            <span className="splash-screen__prompt">Press any key or click anywhere to begin</span>
            <span className="splash-screen__copyright">© 2026 SWITCH Mobility Automotive Ltd. | PROPRIETARY AND CONFIDENTIAL | INTERNAL USE ONLY.</span>
          </button>
        )}

        {appState === 'FLOWCHART_VIEWER' && (
          <>
            <FlowchartShell navigationSlot={showNavigationControls ? navigationControls : undefined} />
            <CommandPalette />
          </>
        )}
      </div>
      <SystemInfoModal />
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <FlowchartProvider>
        <AppExperience />
      </FlowchartProvider>
    </ThemeProvider>
  )
}

export default App
