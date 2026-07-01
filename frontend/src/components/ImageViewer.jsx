import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ImageViewer({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>
        <X size={24} />
      </button>
      <img src={src} alt="Full-size preview" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}
