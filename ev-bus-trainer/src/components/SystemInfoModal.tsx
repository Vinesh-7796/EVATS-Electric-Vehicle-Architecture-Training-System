import React, { useEffect } from 'react'
import { useFlowchart } from '../contexts/FlowchartContext'

export const SystemInfoModal: React.FC = () => {
  const { infoModalOpen, setInfoModalOpen } = useFlowchart()

  // Handle escape key to close
  useEffect(() => {
    if (!infoModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setInfoModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [infoModalOpen, setInfoModalOpen])

  if (!infoModalOpen) return null

  return (
    <div
      className="system-info-modal-overlay"
      onClick={() => setInfoModalOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="System Info"
    >
      <div
        className="system-info-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="terminal-header">
          <span className="terminal-title">SYSTEM INFO</span>
          <button
            type="button"
            className="terminal-close-btn"
            onClick={() => setInfoModalOpen(false)}
            aria-label="Close dialog"
          >
            [X]
          </button>
        </div>
        <div className="terminal-divider">-----------------------------------------------------------</div>
        <div className="terminal-body">
          <p className="terminal-line"><span className="terminal-label">APPLICATION:</span> EVATS (Electric Vehicle Architecture</p>
          <p className="terminal-line-indent">Training System)</p>
          <p className="terminal-line"><span className="terminal-label">BUILD STATUS:</span> v1.3-Stable (July 2026)</p>
          
          <div className="terminal-spacer" />
          
          <p className="terminal-line"><span className="terminal-label">BUILT BY:</span></p>
          <p className="terminal-line-list">&gt; Vinesh – Technical Documentation, Flowchart Logic,</p>
          <p className="terminal-line-list-indent">and UI Architecture</p>
          <p className="terminal-line-link">
            [<a
              href="https://www.linkedin.com/in/vinesh7796"
              target="_blank"
              rel="noopener noreferrer"
              className="terminal-anchor"
            >
              https://www.linkedin.com/in/vinesh7796
            </a>]
          </p>
          
          <div className="terminal-spacer" />
          
          <p className="terminal-line"><span className="terminal-label">SECURITY CLASSIFICATION:</span></p>
          <p className="terminal-line-list">- SWITCH Mobility Internal Evaluation Tool</p>
          <p className="terminal-line-list">- PROPRIETARY AND CONFIDENTIAL DATA</p>
          
          <div className="terminal-spacer-large" />
          
          <p className="terminal-copyright">© 2026 SWITCH Mobility Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
