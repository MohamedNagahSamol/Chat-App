import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useChatStore from '../store/chatStore'
import useAuthStore from '../store/authStore'
import { ArrowLeft, MessageCircle, Calendar, Edit3, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const deleteAccount = useAuthStore((s) => s.deleteAccount)
  const logout = useAuthStore((s) => s.logout)
  const { users, getUsers, selectUser, onlineUsers } = useChatStore()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (users.length === 0) getUsers()
  }, [])

  const isOwnProfile = currentUser?._id === userId
  const user = isOwnProfile ? currentUser : users.find((u) => u._id === userId)

  if (!user) {
    return (
      <div className="profile-page">
        <div className="spinner" />
      </div>
    )
  }

  const isOnline = onlineUsers.includes(user._id)
  const joined = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className="profile-page">
      <button className="profile-back" onClick={() => navigate('/chat')}>
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="profile-card">
        <div className="profile-accent-bar" />

        <div className="profile-avatar-section">
          <div className={`profile-avatar-ring ${isOnline ? 'online' : ''}`}>
            <div className="profile-avatar">
              {user.pimage ? (
                <img src={user.pimage} alt={user.name} />
              ) : (
                user.name?.[0]?.toUpperCase()
              )}
            </div>
          </div>
          <span className={`profile-status-dot ${isOnline ? 'online' : ''}`} />
        </div>

        <h1 className="profile-name">{user.name}</h1>
        {user.email && <p className="profile-email">{user.email}</p>}

        <div className="profile-status-row">
          <span className={`status-indicator ${isOnline ? 'online' : ''}`} />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {joined && (
          <div className="profile-joined">
            <Calendar size={13} />
            <span>Member since {joined}</span>
          </div>
        )}

        <div className="profile-divider" />

        <div className="profile-actions">
          {isOwnProfile ? (
            <button className="btn-secondary" onClick={() => navigate('/chat')}>
              <Edit3 size={16} />
              Edit Profile
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => {
                selectUser(user)
                navigate('/chat')
              }}
            >
              <MessageCircle size={16} />
              Send Message
            </button>
          )}
          <button className="btn-ghost" onClick={() => navigate('/chat')}>
            Back to Chat
          </button>
        </div>

        {isOwnProfile && (
          <>
            <div className="profile-divider danger-divider" />
            <div className="profile-actions">
              <button className="btn-delete-account" onClick={() => setShowDeleteModal(true)}>
                <AlertTriangle size={14} />
                Delete Account
              </button>
            </div>
          </>
        )}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">
              <AlertTriangle size={24} />
            </div>
            <h3 className="modal-title">Delete Account</h3>
            <p className="modal-desc">
              This will permanently delete your account and all your messages. This action cannot be undone.
            </p>
            <label className="modal-label">
              Type <strong>{currentUser?.name}</strong> to confirm
            </label>
            <input
              className="modal-input"
              type="text"
              placeholder={currentUser?.name}
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmName('') }}
              >
                Cancel
              </button>
              <button
                className="modal-btn modal-btn-danger"
                disabled={deleteConfirmName !== currentUser?.name || deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    await deleteAccount()
                    toast.success('Account deleted')
                    navigate('/login')
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to delete account')
                  } finally {
                    setDeleting(false)
                    setShowDeleteModal(false)
                    setDeleteConfirmName('')
                  }
                }}
              >
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
