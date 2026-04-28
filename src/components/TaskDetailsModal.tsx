import React, { useState, useEffect, useRef } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatError(err: any) {
  try {
    if (!err) return ''
    const resp = err.response?.data || err
    if (typeof resp === 'string') return resp
    if (resp?.detail) {
      if (typeof resp.detail === 'string') return resp.detail
      if (Array.isArray(resp.detail)) {
        return resp.detail.map((d: any) => {
          if (typeof d === 'string') return d
          if (d?.msg) return `${(d.loc || []).join('.')} : ${d.msg}`
          return JSON.stringify(d)
        }).join('; ')
      }
      return JSON.stringify(resp.detail)
    }
    if (Array.isArray(resp)) {
      return resp.map((d: any) => (d?.msg ? `${(d.loc||[]).join('.')} : ${d.msg}` : JSON.stringify(d))).join('; ')
    }
    return JSON.stringify(resp)
  } catch (e) {
    return String(err)
  }
}

type ProjectUser = { id: number; email: string; first_name?: string; last_name?: string }
type Task = {
    id: number;
    title: string;
    description?: string;
    column_id: number;
    priority?: string;
    position: number;
    created_at?: string;
    finished_at?: string;
    assigned_to?: number;
    created_by?: number;
    parent_id?: number;
    subtasks?: Task[];
    is_finished?: boolean;
    parent?: { id: number; title: string; is_finished: boolean }
}

type TaskLog = {
    id: number;
    task_id: number;
    message: string;
    created_at: string;
    user_id?: number;
    user?: { id: number; first_name: string; last_name: string; email: string; }
}

type Props = {
  open: boolean
  onClose: () => void
  task: Task | null
  onUpdate: (updatedTask: Task) => void
  onDelete: (taskId: number) => void
  onNavigate: (taskId: number) => void
  projectUsers: ProjectUser[]
}

export default function TaskDetailsModal({ open, onClose, task, onUpdate, onDelete, onNavigate, projectUsers }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [logs, setLogs] = useState<TaskLog[]>([])
  const [newComment, setNewComment] = useState('')
  const [subtasks, setSubtasks] = useState<Task[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [newSubtaskAssignee, setNewSubtaskAssignee] = useState<number | undefined>(undefined)
  const [activeDropdown, setOpenDropdown] = useState<string | null>(null)
  const [editingLogId, setEditingLogId] = useState<number | null>(null)
  const [editingLogText, setEditingLogText] = useState('')
  const [drawerWidth, setDrawerWidth] = useState(600)

  const { user: currentUser } = useAuth()
  const logsContainerRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    const startX = e.clientX
    const startWidth = drawerWidth
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return
      const delta = startX - ev.clientX
      setDrawerWidth(Math.min(1200, Math.max(400, startWidth + delta)))
    }
    const onUp = () => {
      isResizing.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const fetchFullTask = async (id: number) => {
      try {
          const res = await api.get(`/tasks/${id}`)
          if (res.data.subtasks) setSubtasks(res.data.subtasks)
          if (res.data.parent && task) task.parent = res.data.parent
      } catch (e) { console.error(e) }
  }

  useEffect(() => {
    if (task && open) {
      setTitle(task.title)
      setDescription(task.description || '')
      setAssignedTo(task.assigned_to)
      setIsEditing(false)
      setSubtasks(task.subtasks || [])
      setNewSubtaskAssignee(currentUser?.id)
      
      api.get(`/task-logs/?task_id=${task.id}`)
        .then(res => setLogs(res.data))
        .catch(console.error)

      fetchFullTask(task.id)
    }
  }, [task, open])

  useEffect(() => {
      if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
      }
  }, [logs])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (!(event.target as HTMLElement).closest('.custom-select-container')) {
        setOpenDropdown(null);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  const handleAddComment = async () => {
      if (!newComment.trim() || !task) return
      try {
          const res = await api.post('/task-logs/', { task_id: task.id, message: newComment })
          setLogs([...logs, res.data])
          setNewComment('')
      } catch (e) { alert("Ошибка добавления комментария") }
  }

  const handleEditLog = async (logId: number) => {
      if (!editingLogText.trim()) return
      try {
          const res = await api.put(`/task-logs/${logId}`, { message: editingLogText })
          setLogs(logs.map(l => l.id === logId ? res.data : l))
          setEditingLogId(null)
          setEditingLogText('')
      } catch (e) { alert("Ошибка редактирования") }
  }

  const handleDeleteLog = async (logId: number) => {
      try {
          await api.delete(`/task-logs/${logId}`)
          setLogs(logs.filter(l => l.id !== logId))
      } catch (e) { alert("Ошибка удаления") }
  }

  const handleAddSubtask = async () => {
      if (!newSubtaskTitle.trim() || !task) return
      try {
          await api.post('/tasks', {
              title: newSubtaskTitle,
              column_id: task.column_id,
              parent_id: task.id,
              assigned_to: newSubtaskAssignee,
              description: ""
          })
          fetchFullTask(task.id)
          setNewSubtaskTitle('')
      } catch (e) { alert(formatError(e) || "Ошибка добавления подзадачи") }
  }

  const toggleSubtaskFinished = async (st: Task) => {
      try {
          await api.put(`/tasks/${st.id}`, { is_finished: !st.is_finished })
          if (task) fetchFullTask(task.id)
      } catch (e) { console.error(e) }
  }

  const handleUpdateSubtaskAssignee = async (stId: number, assigneeId: number) => {
      try {
          await api.put(`/tasks/${stId}`, { assigned_to: assigneeId })
          if (task) fetchFullTask(task.id)
      } catch (e) { alert("Ошибка обновления исполнителя") }
  }

  const getUserName = (userId?: number) => {
      if (!userId) return 'Не назначен'
      const u = projectUsers.find(u => u.id === userId)
      if (!u) return 'Неизвестный'
      return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const payload: any = { title, description: description || "" }
      if (assignedTo !== undefined) payload.assigned_to = assignedTo
      const res = await api.put(`/tasks/${task!.id}`, payload)
      onUpdate(res.data)
      setIsEditing(false)
    } catch (e) { alert("Ошибка сохранения") }
    finally { setLoading(false) }
  }

  const handleToggleFinished = async () => {
    if (!task) return
    try {
      const res = await api.put(`/tasks/${task.id}`, { is_finished: !task.is_finished })
      onUpdate(res.data)
    } catch (e) { alert("Ошибка") }
  }

  const handleDelete = async () => {
      if (!window.confirm("Удалить задачу?")) return
      setLoading(true)
      try {
          await api.delete(`/tasks/${task!.id}`)
          onDelete(task!.id)
          onClose()
      } catch(e) { alert("Ошибка удаления") }
      finally { setLoading(false) }
  }

  const formatMoscowTime = (dateString: string) => {
      const dateStr = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
      const date = new Date(dateStr);
      return date.toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
  }

  if (!open || !task) return null

  return (
    <div className="drawer-backdrop">
      <div ref={modalContentRef} className="drawer-content" style={{width: `${drawerWidth}px`}}>
        <div className="drawer-resize-handle" onMouseDown={handleResizeStart} />
        {/* Breadcrumbs */}
        <div style={{fontSize: '13px', color: '#94a3b8', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{cursor: 'pointer'}} onClick={onClose}>Доска</span>
            {task.parent && (
                <>
                    <span>/</span>
                    <span style={{cursor: 'pointer', color: '#0ea5a4', fontWeight: '500'}} onClick={() => onNavigate(task.parent!.id)}>
                        {task.parent.title}
                    </span>
                </>
            )}
            <span>/</span>
            <span style={{fontWeight: '600', color: '#475569'}}>{task.title}</span>
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0, gap: '12px'}}>
            {isEditing ? (
                <input value={title} onChange={e => setTitle(e.target.value)} className="form-input-title" style={{flex: 1}} />
            ) : (
                <h3 style={{margin: 0, flex: 1, fontSize: '24px', fontWeight: '700'}}>{task.title}</h3>
            )}
            <div style={{display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0}}>
                {!isEditing && (<>
                  <button
                    className="btn secondary"
                    onClick={handleToggleFinished}
                    disabled={loading}
                    style={task.is_finished ? {color: '#0ea5a4', borderColor: '#0ea5a4', fontWeight: 600} : {}}
                  >
                    {task.is_finished ? '✓ Выполнено' : 'Отметить выполненной'}
                  </button>
                  <button className="btn secondary" onClick={handleDelete} disabled={loading} style={{color: '#ef4444', borderColor: '#fee2e2'}}>Удалить</button>
                </>)}
                {isEditing ? (
                    <>
                        <button className="btn secondary" onClick={() => setIsEditing(false)} disabled={loading}>Отмена</button>
                        <button className="btn" onClick={handleSave} disabled={loading}>Сохранить</button>
                    </>
                ) : (
                    <button className="btn" onClick={() => setIsEditing(true)}>Редактировать</button>
                )}
                <button onClick={onClose} style={{background: 'transparent', border: 'none', fontSize: '1.5em', cursor: 'pointer', color: '#94a3b8', lineHeight: 1}}>&times;</button>
            </div>
        </div>

        <div className="hide-scrollbar" style={{display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, overflowY: 'auto'}}>
            {/* Main Info */}
            <div style={{display: 'flex', gap: '32px', borderBottom: '1px solid #f1f5f9', paddingBottom: '24px'}}>
                <div style={{flex: 1}}>
                    <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '8px'}}>Исполнитель</label>
                    {isEditing ? (
                        <select value={assignedTo || ''} onChange={e => setAssignedTo(e.target.value ? parseInt(e.target.value, 10) : undefined)} className="form-select">
                            {projectUsers.map(u => (
                                <option key={u.id} value={u.id}>{[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}</option>
                            ))}
                        </select>
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <div style={{width: '24px', height: '24px', borderRadius: '50%', background: '#0ea5a4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold'}}>
                                {getUserName(task.assigned_to).charAt(0).toUpperCase()}
                            </div>
                            <span style={{fontWeight: '500'}}>{getUserName(task.assigned_to)}</span>
                        </div>
                    )}
                </div>
                <div style={{flex: 1}}>
                    <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '8px'}}>Создано</label>
                    <div style={{color: '#475569', fontSize: '14px'}}>{task.created_at ? formatMoscowTime(task.created_at) : '-'}</div>
                </div>
                {task.is_finished && (
                    <div style={{flex: 1}}>
                        <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#0ea5a4', display: 'block', marginBottom: '8px'}}>Завершено</label>
                        <div style={{color: '#0ea5a4', fontSize: '14px', fontWeight: 500}}>{task.finished_at ? formatMoscowTime(task.finished_at) : '-'}</div>
                    </div>
                )}
            </div>

            {/* Description */}
            <div>
                <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '12px'}}>Описание</label>
                {isEditing ? (
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={6} className="form-textarea" placeholder="Добавьте описание задачи..." />
                ) : (
                    <div style={{color: '#1e293b', lineHeight: '1.6', fontSize: '15px', whiteSpace: 'pre-wrap'}}>
                        {task.description || <span style={{color: '#94a3b8', fontStyle: 'italic'}}>Нет описания</span>}
                    </div>
                )}
            </div>

            {/* Subtasks */}
            <div>
                <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '12px'}}>Подзадачи ({subtasks.length})</label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '2px'}}>
                    {subtasks.map(st => (
                        <div key={st.id} className="subtask-row" style={{border: 'none', background: 'transparent', padding: '4px 0'}}>
                            <input 
                                type="checkbox" 
                                checked={!!st.is_finished} 
                                onChange={(e) => { e.stopPropagation(); toggleSubtaskFinished(st); }}
                                style={{cursor: 'pointer'}}
                            />
                            <span 
                                style={{
                                    flex: 1, 
                                    fontSize: '14px', 
                                    cursor: 'pointer',
                                    textDecoration: st.is_finished ? 'line-through' : 'none', 
                                    color: st.is_finished ? '#94a3b8' : '#1e293b'
                                }}
                                onClick={() => onNavigate(st.id)}
                            >
                                {st.title}
                            </span>
                            
                            {/* Custom Inline Assignee Selection */}
                            <div className="custom-select-container" style={{ width: 'auto' }}>
                                <div 
                                    className={`user-badge-compact ${activeDropdown === 'st-' + st.id ? 'active' : ''}`}
                                    onClick={() => setOpenDropdown(activeDropdown === 'st-' + st.id ? null : 'st-' + st.id)}
                                >
                                    {[getUserName(st.assigned_to).split(' ')[0], getUserName(st.assigned_to).split(' ')[1]?.charAt(0)].filter(Boolean).join(' ')}
                                </div>
                                {activeDropdown === 'st-' + st.id && (
                                    <div className="custom-select-options" style={{ right: 0, left: 'auto', minWidth: '200px' }}>
                                        {projectUsers.map(u => (
                                            <div 
                                                key={u.id} 
                                                className={`custom-select-option ${u.id === st.assigned_to ? 'selected' : ''}`}
                                                onClick={() => { handleUpdateSubtaskAssignee(st.id, u.id); setOpenDropdown(null); }}
                                            >
                                                {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Improved Creation Group */}
                <div className="subtask-input-group" style={{marginTop: '12px'}}>
                    <input 
                        value={newSubtaskTitle}
                        onChange={e => setNewSubtaskTitle(e.target.value)}
                        placeholder="Что нужно сделать?"
                        className="form-input"
                        style={{flex: 1, border: 'none', background: 'transparent', padding: '4px 0'}}
                        onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask() }}
                    />
                    <div style={{display: 'flex', gap: '8px', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px'}}>
                        <div className="custom-select-container" style={{ flex: 1 }}>
                            <div 
                                className={`custom-select-trigger mini ${activeDropdown === 'new' ? 'active' : ''}`}
                                onClick={() => setOpenDropdown(activeDropdown === 'new' ? null : 'new')}
                            >
                                <span style={{ fontSize: '13px' }}>{getUserName(newSubtaskAssignee)}</span>
                                <div className="select-arrow"></div>
                            </div>
                            {activeDropdown === 'new' && (
                                <div className="custom-select-options" style={{ bottom: 'calc(100% + 8px)', top: 'auto' }}>
                                    {projectUsers.map(u => (
                                        <div 
                                            key={u.id} 
                                            className={`custom-select-option ${u.id === newSubtaskAssignee ? 'selected' : ''}`}
                                            onClick={() => { setNewSubtaskAssignee(u.id); setOpenDropdown(null); }}
                                        >
                                            {[u.first_name, u.last_name].filter(Boolean).join(' ') || u.email}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button className="btn" onClick={() => handleAddSubtask()} disabled={!newSubtaskTitle.trim()} style={{padding: '6px 16px', height: '34px', fontSize: '13px', fontWeight: '600'}}>Добавить</button>
                    </div>
                </div>
            </div>

            {/* Comments */}
            <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '24px'}}>
                <label style={{fontSize: '0.75em', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8', display: 'block', marginBottom: '16px'}}>Комментарии ({logs.length})</label>
                <div ref={logsContainerRef} className="hide-scrollbar" style={{overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    {logs.map(log => {
                        const isMyComment = currentUser && log.user_id === currentUser.id
                        const author = log.user ? ([log.user.first_name, log.user.last_name].filter(Boolean).join(' ') || log.user.email) : 'Система'
                        const isEditing = editingLogId === log.id
                        return (
                            <div key={log.id} className="comment-row" style={{alignSelf: isMyComment ? 'flex-end' : 'flex-start', maxWidth: '85%'}}>
                                <div style={{fontSize: '11px', color: '#94a3b8', marginBottom: '4px', textAlign: isMyComment ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: isMyComment ? 'flex-end' : 'flex-start'}}>
                                    <span style={{fontWeight: '700', color: '#64748b'}}>{author}</span> • {formatMoscowTime(log.created_at)}
                                    {isMyComment && !isEditing && (
                                        <span className="comment-actions">
                                            <button className="comment-action-btn" title="Редактировать" onClick={() => { setEditingLogId(log.id); setEditingLogText(log.message) }}>✎</button>
                                            <button className="comment-action-btn" title="Удалить" onClick={() => handleDeleteLog(log.id)}>✕</button>
                                        </span>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                                        <input
                                            value={editingLogText}
                                            onChange={e => setEditingLogText(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter') handleEditLog(log.id); if (e.key === 'Escape') setEditingLogId(null) }}
                                            className="form-input"
                                            autoFocus
                                            style={{fontSize: '14px', padding: '8px 12px'}}
                                        />
                                        <button className="btn" onClick={() => handleEditLog(log.id)} style={{padding: '6px 12px', fontSize: '13px'}}>✓</button>
                                        <button className="btn secondary" onClick={() => setEditingLogId(null)} style={{padding: '6px 12px', fontSize: '13px'}}>✕</button>
                                    </div>
                                ) : (
                                    <div style={{background: isMyComment ? '#0ea5a4' : '#f1f5f9', color: isMyComment ? 'white' : '#1e293b', padding: '10px 14px', borderRadius: isMyComment ? '14px 14px 2px 14px' : '14px 14px 14px 2px', fontSize: '14px'}}>{log.message}</div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        {/* Comment input — always pinned to bottom */}
        <div style={{flexShrink: 0, borderTop: '1px solid #f1f5f9', paddingTop: '16px', display: 'flex', gap: '8px'}}>
            <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Напишите сообщение..." className="form-input" onKeyDown={e => { if (e.key === 'Enter') handleAddComment() }} />
            <button className="btn" onClick={handleAddComment} disabled={!newComment.trim()} style={{padding: '0 16px'}}>&#10148;</button>
        </div>

      </div>
    </div>
  )
}
