import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function VideoPlayer({ src, onClose }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="video-player-overlay" onClick={onClose}>
      <button className="video-player-close" onClick={onClose}>
        <X size={24} />
      </button>
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay
        onClick={(e) => e.stopPropagation()}
        className="video-player-element"
      />
    </div>
  )
}
