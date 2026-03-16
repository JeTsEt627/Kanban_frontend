import React from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  projectName: string
  loading: boolean
}

export default function DeleteProjectModal({ open, onClose, onConfirm, projectName, loading }: Props) {
  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <h3>Удалить доску "{projectName}"?</h3>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>
          Это действие необратимо. Все задачи и колонки будут удалены навсегда.
        </p>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onClose} disabled={loading}>
            Отмена
          </button>
          <button 
            className="btn" 
            onClick={onConfirm} 
            disabled={loading}
            style={{ backgroundColor: '#ef4444' }}
          >
            {loading ? 'Удаление...' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  )
}
