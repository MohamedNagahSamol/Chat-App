import { useState, useRef } from 'react'
import useChatStore from '../store/chatStore'
import { Send, Image, Video, X } from 'lucide-react'

export default function MessageInput() {
  const [text, setText] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaType, setMediaType] = useState(null)
  const [sending, setSending] = useState(false)
  const imageRef = useRef(null)
  const videoRef = useRef(null)
  const { selectedUser, sendMessage } = useChatStore()

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaType('image')
    e.target.value = ''
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setMediaFile(file)
    setMediaType('video')
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (sending) return
    if ((!text.trim() && !mediaFile) || !selectedUser) return
    setSending(true)
    try {
      await sendMessage(selectedUser._id, text.trim(), mediaFile, mediaType)
      setText('')
      setMediaFile(null)
      setMediaType(null)
    } finally {
      setSending(false)
    }
  }

  if (!selectedUser) return null

  return (
    <>
      {mediaFile && (
        <div className="image-preview">
          {mediaType === 'video' ? (
            <video src={URL.createObjectURL(mediaFile)} muted className="video-preview-thumb" />
          ) : (
            <img src={URL.createObjectURL(mediaFile)} alt="Preview" />
          )}
          <button type="button" onClick={() => { setMediaFile(null); setMediaType(null) }}>
            <X size={18} />
          </button>
        </div>
      )}
      <form className="message-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          ref={imageRef}
          onChange={handleImageChange}
          hidden
        />
        <input
          type="file"
          accept="video/*"
          ref={videoRef}
          onChange={handleVideoChange}
          hidden
        />
        <button type="button" className="image-btn" onClick={() => imageRef.current?.click()}>
          <Image size={20} />
        </button>
        <button type="button" className="image-btn" onClick={() => videoRef.current?.click()}>
          <Video size={20} />
        </button>
        <button type="submit" disabled={(!text.trim() && !mediaFile) || sending}>
          <Send size={20} />
        </button>
      </form>
    </>
  )
}
