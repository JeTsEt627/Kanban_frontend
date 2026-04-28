import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import Sidebar from '../components/Sidebar'
import CreateTaskModal from '../components/CreateTaskModal'
import EditColumnsModal from '../components/EditColumnsModal'
import TaskDetailsModal from '../components/TaskDetailsModal'
import AddUserModal from '../components/AddUserModal'
import '../index.css'

type Column = { id: number; name: string; position: number }
type Task = { id: number; title: string; description?: string; column_id?: number; priority?: string; position: number; parent_id?: number | null; is_finished?: boolean }

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false)
  const [editColumnsModalOpen, setEditColumnsModalOpen] = useState(false)
  const [addUserModalOpen, setAddUserModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const dragPreviewRef = React.useRef<{ element: HTMLElement, offsetX: number, offsetY: number } | null>(null)
  const boardRef = React.useRef<HTMLDivElement>(null)

  const refreshData = async () => {
    if (!projectId) return
    try {
      const [pRes, cRes, tRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/columns?project_id=${projectId}`),
        api.get(`/tasks/?project_id=${projectId}`),
      ])
      setProject(pRes.data)
      setColumns((cRes.data || []).sort((a: Column, b: Column) => a.position - b.position))
      setTasks((tRes.data || []).sort((a: Task, b: Task) => a.position - b.position))
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 403) {
        navigate('/dashboard', { replace: true, state: { toast: 'У вас нет доступа к этому проекту' } })
      } else if (status === 404) {
        navigate('/dashboard', { replace: true, state: { toast: 'Проект не найден' } })
      } else {
        console.error(err)
      }
    }
  }

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    refreshData()
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  const handleNavigate = async (taskId: number) => {
      try {
          const res = await api.get(`/tasks/${taskId}`)
          setSelectedTask(res.data)
      } catch (err) { console.error("Failed to navigate to task", err) }
  }

  const handleTaskUpdated = (updatedTask: any) => {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
      if (selectedTask && selectedTask.id === updatedTask.id) {
          setSelectedTask(updatedTask)
      }
  }

  const handleToggleFinished = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation()
    try {
      const res = await api.put(`/tasks/${task.id}`, { is_finished: !task.is_finished })
      handleTaskUpdated(res.data)
    } catch (err) { console.error(err) }
  }

  const handleTaskDeleted = (taskId: number) => {
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setSelectedTask(null)
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask])
    setCreateTaskModalOpen(false)
  }

  const cleanupDrag = () => {
    if (dragPreviewRef.current) {
      if (document.body.contains(dragPreviewRef.current.element)) {
        document.body.removeChild(dragPreviewRef.current.element)
      }
      dragPreviewRef.current = null
    }
    window.removeEventListener('dragend', cleanupDrag)
  }

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString())
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.width = `${rect.width}px`
    clone.style.top = `${rect.top}px`
    clone.style.left = `${rect.left}px`
    clone.style.zIndex = '9999'
    clone.style.pointerEvents = 'none'
    clone.style.boxShadow = '0 10px 20px rgba(0,0,0,0.25)'
    document.body.appendChild(clone)
    dragPreviewRef.current = { element: clone, offsetX, offsetY }
    const img = new Image(); img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)
    window.addEventListener('dragend', cleanupDrag, { once: true })
  }

  useEffect(() => {
    const onDocDragOver = (e: DragEvent) => {
      if (!dragPreviewRef.current) return
      const board = boardRef.current
      if (!board) return
      const ZONE = 120
      const SPEED = 10
      if (e.clientX < ZONE) {
        board.scrollLeft -= SPEED
      } else if (e.clientX > window.innerWidth - ZONE) {
        board.scrollLeft += SPEED
      }
    }
    document.addEventListener('dragover', onDocDragOver)
    return () => document.removeEventListener('dragover', onDocDragOver)
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX === 0 || !dragPreviewRef.current) return
    dragPreviewRef.current.element.style.left = `${e.clientX - dragPreviewRef.current.offsetX}px`
    dragPreviewRef.current.element.style.top = `${e.clientY - dragPreviewRef.current.offsetY}px`
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault(); cleanupDrag()
    const taskIdStr = e.dataTransfer.getData('taskId')
    if (!taskIdStr) return
    const taskId = parseInt(taskIdStr, 10)
    try {
      await api.put(`/tasks/${taskId}`, { column_id: targetColumnId })
      refreshData()
    } catch (err) { console.error("Failed to move task", err) }
  }

  if (loading) return <div className="app-layout"><Sidebar /><main className="main-area">Загрузка...</main></div>
  if (!project) return <div className="app-layout"><Sidebar /><main className="main-area">Проект не найден</main></div>

  const projectUsers = (() => {
      const all = [...(project.users || [])]
      if (project.creator && !all.find(u => u.id === project.creator.id)) all.push(project.creator)
      return all
  })()

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <header className="main-header">
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' }}>{project.name}</h1>
            <p style={{ color: '#64748b', margin: 0 }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn secondary" onClick={() => setAddUserModalOpen(true)}>Добавить пользователя</button>
            <button className="btn secondary" onClick={() => setEditColumnsModalOpen(true)}>Ред. колонки</button>
            <button className="btn" onClick={() => setCreateTaskModalOpen(true)}>Создать задачу</button>
          </div>
        </header>

        <div className="kanban-board" ref={boardRef}>
          {columns.map(col => (
            <div key={col.id} className="kanban-column" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, col.id)}>
              <h3 className="column-header">{col.name}</h3>
              <div className="column-content">
                {tasks.filter(t => t.column_id === col.id && !t.parent_id).map(task => (
                  <div key={task.id} className={`task-card${task.is_finished ? ' task-finished' : ''}`} draggable onDragStart={e => handleDragStart(e, task.id)} onDrag={handleDrag} onClick={() => setSelectedTask(task)}>
                    <div style={{display: 'flex', alignItems: 'flex-start', gap: '8px'}}>
                      <button
                        className={`task-check-btn${task.is_finished ? ' checked' : ''}`}
                        onClick={e => handleToggleFinished(e, task)}
                        title={task.is_finished ? 'Снять отметку' : 'Отметить выполненной'}
                      >
                        {task.is_finished && '✓'}
                      </button>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div className="task-title" style={{textDecoration: task.is_finished ? 'line-through' : 'none', color: task.is_finished ? '#94a3b8' : undefined}}>{task.title}</div>
                        {task.description && <div className="task-desc">{task.description}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <CreateTaskModal open={createTaskModalOpen} onClose={() => setCreateTaskModalOpen(false)} onCreated={handleTaskCreated} projectId={projectId || ''} columns={columns} projectUsers={projectUsers} />
      <EditColumnsModal open={editColumnsModalOpen} onClose={() => setEditColumnsModalOpen(false)} columns={columns} onUpdate={refreshData} projectId={projectId || ''} />
      <AddUserModal open={addUserModalOpen} onClose={() => setAddUserModalOpen(false)} projectId={projectId || ''} onAdded={refreshData} />
      
      {selectedTask && (
        <TaskDetailsModal
          open={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask as any}
          onUpdate={handleTaskUpdated}
          onDelete={handleTaskDeleted}
          onNavigate={handleNavigate}
          projectUsers={projectUsers}
        />
      )}
    </div>
  )
}
