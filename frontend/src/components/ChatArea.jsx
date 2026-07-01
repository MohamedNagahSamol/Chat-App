import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import MessageInput from './MessageInput'
import ImageViewer from './ImageViewer'
import VideoPlayer from './VideoPlayer'
import { MessageCircle, Play, Menu } from 'lucide-react'

export default function ChatArea({ onToggleSidebar }) {
  const { messages, selectedUser } = useChatStore()
  const user = useAuthStore((s) => s.user)
  const endRef = useRef(null)
  const navigate = useNavigate()
  const [viewerImage, setViewerImage] = useState(null)
  const [viewerVideo, setViewerVideo] = useState(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!selectedUser) {
    return (
      <div className="chat-area empty">
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={24} />
        </button>
        <MessageCircle size={64} />
        <h2>Chat App</h2>
        <p>Select a user to start chatting</p>
        <p className="mobile-hint">Tap the menu icon to open the sidebar</p>
      </div>
    )
  }

  return (
    <div className="chat-area">
      <div className="chat-header">
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        {selectedUser.pimage ? <img src={selectedUser.pimage} alt={selectedUser.name} className="avatar small" onClick={() => navigate(`/profile/${selectedUser._id}`)} /> :
          <div className="avatar small" onClick={() => navigate(`/profile/${selectedUser._id}`)} style={{ cursor: 'pointer' }}>{selectedUser.name?.[0]?.toUpperCase()}</div>}
        <div onClick={() => navigate(`/profile/${selectedUser._id}`)} style={{ cursor: 'pointer' }}>
          <strong>{selectedUser.name}</strong>
        </div>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <p className="no-messages">No messages yet. Say hello!</p>
        )}
        {messages.map((msg, i) => {
          const isMine = msg.senderId === user?._id
          return (
            <div key={msg._id || i} className={`message ${isMine ? 'mine' : 'theirs'}`}>
              <div className="bubble">
                {msg.image && <img src={msg.image} alt="Image" className="bubble-image" style={{ cursor: 'pointer' }} onClick={() => setViewerImage(msg.image)} />}
                {msg.video && (
                  <div className="bubble-video" onClick={() => setViewerVideo(msg.video)}>
                    <video src={msg.video} preload="metadata" muted />
                    <div className="bubble-video-play">
                      <Play size={32} />
                    </div>
                  </div>
                )}
                {msg.message || msg.text ? <p>{msg.message || msg.text}</p> : null}
                <span className="time">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <MessageInput />

      {viewerImage && <ImageViewer src={viewerImage} onClose={() => setViewerImage(null)} />}
      {viewerVideo && <VideoPlayer src={viewerVideo} onClose={() => setViewerVideo(null)} />}
    </div>
  )
}
