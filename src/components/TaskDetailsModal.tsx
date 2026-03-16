import React, { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

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

type TaskLog = {
    id: number;
    task_id: number;
    message: string;
    created_at: string;
    user_id?: number;
    user?: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    }
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
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [newComment, setNewComment] = useState('')
  const { user } = useAuth()
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null) // Ref for the modal content

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setAssignedTo(task.assigned_to)
      setIsEditing(false) // Reset editing state when opening new task
      
      // Fetch logs
      api.get(`/task-logs/?task_id=${task.id}`)
        .then(res => setLogs(res.data))
        .catch(console.error)
    }
  }, [task, open])

  useEffect(() => {
      if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
      }
  }, [logs])

  // Global event listener to close modal if click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]); // Re-run if modal open state or onClose function changes

  const handleAddComment = async () => {
      if (!newComment.trim() || !task) return
      try {
          const res = await api.post('/task-logs/', { task_id: task.id, message: newComment })
          setLogs([...logs, res.data])
          setNewComment('')
      } catch (e) {
          console.error(e)
          alert("Ошибка добавления комментария")
      }
  }


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
  
  const getLogAuthorName = (log: TaskLog) => {
      if (log.user) {
          const fullName = [log.user.first_name, log.user.last_name].filter(Boolean).join(' ')
          return fullName || log.user.email
      }
      return 'Неизвестный'
  }

  const formatMoscowTime = (dateString: string) => {
      // Ensure the date is treated as UTC if it doesn't have timezone info
      const dateStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
      const date = new Date(dateStr);
      return date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  }

  return (
    <div className="modal-backdrop">
      <div ref={modalContentRef} className="modal" style={{maxWidth: '900px', width: '95%', height: '80vh', display: 'flex', flexDirection: 'column'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', flexShrink: 0}}>
            {isEditing ? (
                <input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    className="form-input-title"
                />
            ) : (
                <h3 style={{margin: 0, flex: 1}}>{task.title}</h3>
            )}
            <button onClick={onClose} style={{background: 'transparent', border: 'none', fontSize: '1.2em', cursor: 'pointer'}}>&times;</button>
        </div>

        <div style={{display: 'flex', gap: '24px', flex: 1, overflow: 'hidden'}}>
            {/* Left Column: Details */}
            <div style={{flex: 1, overflowY: 'auto', paddingRight: '12px'}}>
                <div style={{marginBottom: '16px'}}>
                    <label style={{fontSize: '0.85em', color: '#64748b'}}>Исполнитель</label>
                    {isEditing ? (
                                                    <select 
                                                        value={assignedTo || ''} 
                                                        onChange={e => setAssignedTo(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                                                        className="form-select"
                                                        style={{marginTop: '4px'}}
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
                                                        rows={15}
                                                        className="form-textarea no-resize"
                                                        style={{marginTop: '4px'}}
                                                    />
                                                ) : (                        <div style={{marginTop: '4px', whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{task.description || 'Нет описания'}</div>
                    )}
                </div>
            </div>

            {/* Right Column: Comments */}
            <div style={{flex: 1, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px'}}>
                <h4 style={{margin: '0 0 16px 0'}}>Комментарии</h4>
                
                <div ref={logsContainerRef} style={{flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px'}}>
                    {logs.length === 0 && <div style={{color: '#94a3b8', fontStyle: 'italic'}}>Нет комментариев</div>}
                    {logs.map(log => {
                        const isMyComment = user && log.user_id === user.id
                        return (
                            <div key={log.id} style={{
                                background: isMyComment ? '#e0f2fe' : '#f1f5f9', 
                                padding: '8px 12px', 
                                borderRadius: '8px',
                                alignSelf: isMyComment ? 'flex-end' : 'flex-start',
                                maxWidth: '90%',
                                minWidth: '60%'
                            }}>
                                <div style={{fontSize: '0.75em', color: '#64748b', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px'}}>
                                    <span style={{fontWeight: 'bold'}}>{getLogAuthorName(log)}</span>
                                    <span>{formatMoscowTime(log.created_at)}</span>
                                </div>
                                <div style={{fontSize: '0.9em', wordWrap: 'break-word'}}>{log.message}</div>
                            </div>
                        )
                    })}
                </div>

                <div style={{display: 'flex', gap: '8px'}}>
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Написать комментарий..."
                        className="form-input"
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                handleAddComment()
                            }
                        }}
                    />
                    <button className="btn" onClick={handleAddComment} disabled={!newComment.trim()} style={{padding: '0 16px'}}>&#10148;</button>
                </div>
            </div>
        </div>

        <div className="modal-actions" style={{justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px'}}>
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
