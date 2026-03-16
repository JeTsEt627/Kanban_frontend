import React, { useState } from 'react'
import api from '../api/client'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
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
      await api.post('/auth/register', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
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
          <label>Имя</label>
          <input value={firstName} onChange={e => setFirstName(e.target.value)} />
        </div>
        <div>
          <label>Фамилия</label>
          <input value={lastName} onChange={e => setLastName(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Пароль</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <small>Пароль должен быть от 8 до 72 символов.</small>
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
