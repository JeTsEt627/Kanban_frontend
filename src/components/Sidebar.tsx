import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Icons = {
  Logo: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#10b981' }}>
      <rect x="3" y="3" width="4" height="10" rx="1" />
      <rect x="10" y="3" width="4" height="18" rx="1" />
      <rect x="17" y="3" width="4" height="14" rx="1" />
    </svg>
  ),
  Board: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="9" y1="3" x2="9" y2="21"/>
      <line x1="15" y1="3" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
    </svg>
  ),
  User: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Logout: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Развернуть" : "Свернуть"}
      >
        {isCollapsed ? <Icons.ChevronRight /> : <Icons.ChevronLeft />}
      </button>

      <div className="sidebar-top">
        <Link to="/" className="brand-link" style={{ textDecoration: 'none', color: 'white' }}>
          <div className="brand">
            <Icons.Logo />
            {!isCollapsed && <span style={{ marginLeft: '12px', fontWeight: '800', fontSize: '22px', letterSpacing: '-0.5px' }}>Nexus</span>}
          </div>
        </Link>
        
        {user?.email && !isCollapsed && (
          <div className="user-nickname" title={user.email} style={{ marginTop: '10px', marginBottom: '10px' }}>
            {user.email.split('@')[0]}
          </div>
        )}

        <Link to="/profile" className="sidebar-btn" title="Профиль">
          <Icons.User />
          {!isCollapsed && <span style={{ marginLeft: '12px', display: 'inline-block' }}>Профиль</span>}
        </Link>
      </div>

      <div className="sidebar-bottom">
        <button onClick={logout} className="sidebar-btn-logout" title="Выйти">
          <Icons.Logout />
          {!isCollapsed && <span style={{ marginLeft: '12px' }}>Выйти</span>}
        </button>
      </div>
    </aside>
  )
}
