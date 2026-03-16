import React, { useState, useEffect } from 'react'
import api from '../api/client'

type ProjectUser = { id: number; email: string; first_name?: string; last_name?: string }
type Task = { 
    id: number; 
    title: string; 
    description?: string; 
    column_id: number; 
    priority?: string; 
    position: number;
    created_at?: string;
    assigned_to?: number;
    created_by?: number;
}

type Props = {
  open: boolean
  onClose: () => void
  task: Task | null
  onUpdate: (updatedTask: Task) => void
  onDelete: (taskId: number) => void
  projectUsers: ProjectUser[]
}

export default function TaskDetailsModal({ open, onClose, task, onUpdate, onDelete, projectUsers }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setAssignedTo(task.assigned_to)
      setIsEditing(false) // Reset editing state when opening new task
    }
  }, [task, open])

  if (!open || !task) return null

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload: any = { title, description: description || null }
      if (assignedTo !== undefined) {
          payload.assigned_to = assignedTo
      }
      
      const res = await api.put(`/tasks/${task.id}`, payload)
      onUpdate(res.data)
      setIsEditing(false)
    } catch (e) {
      console.error(e)
      alert("Ошибка сохранения")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
      if (!window.confirm("Удалить задачу?")) return
      setLoading(true)
      try {
          await api.delete(`/tasks/${task.id}`)
          onDelete(task.id)
          onClose()
      } catch(e) {
          console.error(e)
          alert("Ошибка удаления")
      } finally {
          setLoading(false)
      }
  }

  const getUserName = (userId?: number) => {
      if (!userId) return 'Не назначен'
      const u = projectUsers.find(u => u.id === userId)
      if (!u) return 'Неизвестный'
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ')
      return fullName || u.email
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{maxWidth: '600px', width: '100%'}} onClick={e => e.stopPropagation()}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px'}}>
            {isEditing ? (
                <input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    style={{fontSize: '1.2em', fontWeight: 'bold', width: '100%'}}
                />
            ) : (
                <h3 style={{margin: 0, flex: 1}}>{task.title}</h3>
            )}
            <button onClick={onClose} style={{background: 'transparent', border: 'none', fontSize: '1.2em', cursor: 'pointer'}}>&times;</button>
        </div>

        <div style={{marginBottom: '16px'}}>
            <label style={{fontSize: '0.85em', color: '#64748b'}}>Исполнитель</label>
            {isEditing ? (
                <select 
                    value={assignedTo || ''} 
                    onChange={e => setAssignedTo(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    style={{display: 'block', width: '100%', marginTop: '4px', padding: '8px'}}
                >
                    {projectUsers.map(u => (
                        <option key={u.id} value={u.id}>
                        {(() => {
                            const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
                            return fullName || u.email;
                        })()}
                        </option>
                    ))}
                </select>
            ) : (
                <div style={{marginTop: '4px', fontWeight: '500'}}>{getUserName(task.assigned_to)}</div>
            )}
        </div>

        <div style={{marginBottom: '24px'}}>
            <label style={{fontSize: '0.85em', color: '#64748b'}}>Описание</label>
            {isEditing ? (
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={5}
                    style={{display: 'block', width: '100%', marginTop: '4px', padding: '8px', resize: 'vertical'}}
                />
            ) : (
                <div style={{marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{task.description || 'Нет описания'}</div>
            )}
        </div>

        <div className="modal-actions" style={{justifyContent: 'space-between'}}>
            <div>
                <button className="btn secondary" onClick={handleDelete} style={{color: '#b91c1c', borderColor: '#b91c1c'}}>Удалить</button>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
                {isEditing ? (
                    <>
                        <button className="btn secondary" onClick={() => setIsEditing(false)} disabled={loading}>Отмена</button>
                        <button className="btn" onClick={handleSave} disabled={loading}>Сохранить</button>
                    </>
                ) : (
                    <button className="btn" onClick={() => setIsEditing(true)}>Редактировать</button>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
