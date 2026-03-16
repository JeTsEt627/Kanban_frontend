import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'
import Sidebar from '../components/Sidebar'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [middleName, setMiddleName] = useState(user?.middle_name || '')

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.patch(`/users/profile/${user.id}`, {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
      })
      setUser(res.data)
      setIsEditing(false)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Не удалось сохранить изменения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <header className="main-header">
          <h2>Профиль</h2>
        </header>
        <div className="profile-card">
          <div className="profile-field">
            <strong>Email:</strong> {user?.email}
          </div>
          <div className="profile-field">
            <strong>Имя:</strong>
            {isEditing ? (
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            ) : (
              <span>{user?.first_name || 'не указано'}</span>
            )}
          </div>
          <div className="profile-field">
            <strong>Фамилия:</strong>
            {isEditing ? (
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            ) : (
              <span>{user?.last_name || 'не указано'}</span>
            )}
          </div>
          <div className="profile-field">
            <strong>Отчество:</strong>
            {isEditing ? (
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />
            ) : (
              <span>{user?.middle_name || 'не указано'}</span>
            )}
          </div>
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn" onClick={handleSave} disabled={loading}>
                  {loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button className="btn secondary" onClick={() => setIsEditing(false)}>
                  Отмена
                </button>
              </>
            ) : (
              <button className="btn" onClick={() => setIsEditing(true)}>
                Редактировать
              </button>
            )}
          </div>
          {error && <div className="error">{error}</div>}
        </div>
      </main>
    </div>
  )
}
