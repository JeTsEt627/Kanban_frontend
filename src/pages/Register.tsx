import React, { useState } from 'react'
import api from '../api/client'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // Use relative path so Vite dev server can proxy /auth -> backend (avoids CORS)
      await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })
      // После регистрации перенаправляем на страницу входа
      navigate('/login')
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2>Регистрация</h2>
      <form className="auth-form" onSubmit={submit}>
        <div>
          <label>Имя пользователя</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}

        <div className="auth-actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
          <Link to="/login" className="btn secondary">Назад к входу</Link>
        </div>
      </form>
    </div>
  )
}
