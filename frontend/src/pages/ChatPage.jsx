import { useState, useEffect } from 'react'
import useAuthStore from '../store/authStore'
import useChatStore from '../store/chatStore'
import Sidebar from '../components/Sidebar'
import ChatArea from '../components/ChatArea'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const connectSocket = useChatStore((s) => s.connectSocket)
  const disconnectSocket = useChatStore((s) => s.disconnectSocket)

  useEffect(() => {
    if (user?._id) {
      connectSocket(user._id)
    }
    return () => disconnectSocket()
  }, [user, connectSocket, disconnectSocket])

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="chat-layout">
      <Sidebar isSidebarOpen={sidebarOpen} onCloseSidebar={closeSidebar} />
      <ChatArea onToggleSidebar={toggleSidebar} />
    </div>
  )
}
