import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <h2>Вход</h2>
      <form className="auth-form" onSubmit={submit}>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}

        <div className="auth-actions">
          <button className="btn" type="submit" disabled={loading}>{loading ? 'Вхожу...' : 'Войти'}</button>
          <Link to="/register" className="btn secondary">Регистрация</Link>
        </div>
      </form>

      <div className="auth-footer">
        Нет аккаунта?
        <Link to="/register" className="auth-link">Зарегистрироваться</Link>
      </div>
    </div>
  )
}
