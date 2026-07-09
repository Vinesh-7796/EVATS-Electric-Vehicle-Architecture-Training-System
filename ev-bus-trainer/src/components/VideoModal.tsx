import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface VideoModalProps {
  videoSrc: string
  title: string
  onClose: () => void
}

// Centred modal player for the per-subsystem OEM training videos. Mirrors the
// dimmed/blurred backdrop used by the command palette and enlarged-image overlay,
// and renders a native HTML5 <video> (Chromium in Electron plays MP4/H.264 with
// no extra dependency). The dialog is capped at 1600×900 and never overflows
// smaller windows; on close the element is paused first so audio can't leak.
export const VideoModal: React.FC<VideoModalProps> = ({ videoSrc, title, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Escape closes the modal — matches the existing Escape handlers in FlowchartViewer.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Pause on unmount so audio never keeps playing after the modal is dismissed.
  useEffect(() => {
    return () => {
      videoRef.current?.pause()
    }
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/55 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <video
            ref={videoRef}
            src={videoSrc}
            controls
            autoPlay
            preload="metadata"
            className="block max-h-[calc(100vh-4rem)] max-w-[calc(100vw-4rem)] rounded-xl shadow-2xl"
          />
          <button
            type="button"
            onClick={onClose}
            className="fixed right-6 top-6 z-[60] rounded-full bg-black/55 p-2 text-white backdrop-blur-sm transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            aria-label="Close video"
          >
            <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </button>
      </motion.div>
    </AnimatePresence>
  )
}
