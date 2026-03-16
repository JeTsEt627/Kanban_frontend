import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user, logout } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link to="/" className="brand-link"><div className="brand">Kanban</div></Link>
      </div>

      <div className="sidebar-bottom">
        {user?.email && (
          <div className="user-nickname" title={user.email}>
            {user.email.split('@')[0]}
          </div>
        )}
        <Link to="/profile" className="sidebar-btn">Профиль</Link>
        <button onClick={logout} className="sidebar-btn-logout">Выйти</button>
      </div>
    </aside>
  )
}
