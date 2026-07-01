import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import { Users, LogOut, Camera, X } from 'lucide-react'

export default function Sidebar({ isSidebarOpen, onCloseSidebar }) {
  const navigate = useNavigate()
  const { users, getUsers, selectedUser, selectUser, onlineUsers } = useChatStore()
  const { user, logout, updateProfile } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    getUsers()
  }, [getUsers])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('pimage', file)
      await updateProfile(formData)
    } finally {
      setUploading(false)
    }
  }

  const handleSelectUser = (u) => {
    selectUser(u)
    onCloseSidebar()
  }

  return (
    <>
      <div className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`} onClick={onCloseSidebar} />
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>
            <Users size={20} /> OBJ Chat
          </h2>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button className="close-sidebar-btn" onClick={onCloseSidebar} title="Close">
              <X size={18} />
            </button>
            <button className="logout-btn" onClick={logout} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <div className="sidebar-user-info">
          <div className="avatar" onClick={() => fileInputRef.current?.click()}>
            {user?.pimage ? (
              <img src={user.pimage} alt={user.name} />
            ) : (
              user?.name?.[0]?.toUpperCase()
            )}
            {uploading ? (
              <div className="camera-overlay" style={{ opacity: 1 }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              </div>
            ) : (
              <div className="camera-overlay">
                <Camera size={16} />
              </div>
            )}
          </div>
          <span className="sidebar-own-name" onClick={() => navigate(`/profile/${user?._id}`)}>
            {user?.name}
          </span>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        <div className="search-box">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="users-list">
          {users
            .filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((u) => (
            <div
              key={u._id}
              className={`user-item ${selectedUser?._id === u._id ? 'active' : ''}`}
              onClick={() => handleSelectUser(u)}
            >
              <div className="user-avatar-wrap">
                <div className="avatar small">
                  {u.pimage ? (
                    <img src={u.pimage} alt={u.name} />
                  ) : (
                    u.name?.[0]?.toUpperCase()
                  )}
                </div>
                <span className={`online-dot ${onlineUsers.includes(u._id) ? 'online' : ''}`} />
              </div>
              <div className="user-meta">
                <span className="user-name">{u.name}</span>
                <span className="user-status">
                  {onlineUsers.includes(u._id) ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="no-users">No users yet</p>}
          {searchQuery && users.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && users.length > 0 && (
            <p className="no-users">No users matching "{searchQuery}"</p>
          )}
        </div>
      </div>
    </>
  )
}
