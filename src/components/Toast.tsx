import React, { useEffect } from 'react'

type ToastProps = {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
  duration?: number
}

export default function Toast({ message, type = 'error', onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  const colors: Record<string, string> = {
    error: '#ef4444',
    success: '#22c55e',
    info: '#2563eb',
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      background: '#1e293b',
      color: 'white',
      padding: '14px 18px',
      borderRadius: '10px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '360px',
      fontSize: '14px',
      lineHeight: '1.4',
      animation: 'toast-in 0.2s ease',
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: colors[type],
        flexShrink: 0,
      }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '16px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  )
}
