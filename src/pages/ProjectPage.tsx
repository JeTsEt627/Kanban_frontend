import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import Sidebar from '../components/Sidebar'
import CreateTaskModal from '../components/CreateTaskModal'
import EditColumnsModal from '../components/EditColumnsModal'
import '../index.css'

type ProjectUser = { id: number; email: string; first_name?: string; last_name?: string }
type Column = { id: number; name: string; position: number }
type Task = { id: number; title: string; description?: string; column_id?: number; priority?: string; position: number }

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<any>(null)
  const [columns, setColumns] = useState<Column[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false) // State for task modal
  const [editColumnsModalOpen, setEditColumnsModalOpen] = useState(false) // State for edit column modal
  const dragPreviewRef = React.useRef<{ element: HTMLElement, offsetX: number, offsetY: number } | null>(null)

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
    } catch (err) {
        console.error(err)
    }
  }

  useEffect(() => {
    if (!projectId) return
    setLoading(true)
    refreshData()
      .catch(err => setError(err?.response?.data?.detail || err.message))
      .finally(() => setLoading(false))
  }, [projectId])

  const cleanupDrag = () => {
    if (dragPreviewRef.current) {
      if (document.body.contains(dragPreviewRef.current.element)) {
        document.body.removeChild(dragPreviewRef.current.element)
      }
      dragPreviewRef.current = null
    }
    // Remove global listener if it exists (safe to call even if not added)
    window.removeEventListener('dragend', cleanupDrag)
  }

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString())
    e.dataTransfer.effectAllowed = 'move'
    e.currentTarget.classList.add('is-dragging')
    
    // Create custom drag preview
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.position = 'fixed'
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.top = `${rect.top}px`
    clone.style.left = `${rect.left}px`
    clone.style.zIndex = '9999'
    clone.style.pointerEvents = 'none'
    clone.style.opacity = '1'
    clone.style.boxShadow = '0 10px 20px rgba(0,0,0,0.25)'
    clone.classList.remove('is-dragging')
    
    document.body.appendChild(clone)
    dragPreviewRef.current = { element: clone, offsetX, offsetY }

    // Set transparent drag image to hide default browser ghost
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)

    // Ensure cleanup happens even if component unmounts
    window.addEventListener('dragend', cleanupDrag, { once: true })
  }

  const handleDrag = (e: React.DragEvent) => {
    if (dragPreviewRef.current && e.clientX !== 0 && e.clientY !== 0) {
      const { element, offsetX, offsetY } = dragPreviewRef.current
      element.style.left = `${e.clientX - offsetX}px`
      element.style.top = `${e.clientY - offsetY}px`
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('is-dragging')
    cleanupDrag()
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    if ((e.target as HTMLElement).classList.contains('kanban-column') || (e.target as HTMLElement).closest('.kanban-column')) {
      (e.currentTarget as HTMLElement).classList.add('is-dragover')
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const relatedTarget = e.relatedTarget as HTMLElement
    
    // Only handle if leaving a column or something inside it
    if (target.classList.contains('kanban-column') || target.closest('.kanban-column')) {
      const columnEl = target.classList.contains('kanban-column') ? target : target.closest('.kanban-column') as HTMLElement
      
      // If we are entering an element that is INSIDE the current column, do nothing
      if (columnEl && relatedTarget && columnEl.contains(relatedTarget)) {
        return
      }
      
      // Otherwise, we really left the column
      if (columnEl) {
        columnEl.classList.remove('is-dragover')
      }
    }
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: number) => {
    e.preventDefault()
    cleanupDrag()
    const columnEl = e.currentTarget as HTMLElement
    columnEl.classList.remove('is-dragover')
    
    const taskIdStr = e.dataTransfer.getData('taskId')
    if (!taskIdStr) return
    const taskId = parseInt(taskIdStr, 10)

    const draggedTask = tasks.find(t => t.id === taskId)
    if (!draggedTask) return

    const columnTasks = tasks.filter(t => t.column_id === targetColumnId && t.id !== taskId).sort((a, b) => a.position - b.position)
    
    let newPosition = columnTasks.length

    const dropY = e.clientY
    
    // Use currentTarget to find task cards within the drop column
    const targetColumnElement = e.currentTarget as HTMLElement
    const taskCards = Array.from(targetColumnElement.querySelectorAll('.task-card')) as HTMLElement[]
    
    for (let i = 0; i < taskCards.length; i++) {
        const card = taskCards[i]
        const rect = card.getBoundingClientRect()
        const middleY = rect.top + rect.height / 2
        
        if (dropY < middleY) {
            const targetTask = columnTasks[i] 
            if (targetTask) {
                newPosition = targetTask.position
            }
            break
        }
    }
    
    if (newPosition === columnTasks.length) {
       if (columnTasks.length > 0) {
           newPosition = columnTasks[columnTasks.length - 1].position + 1
       } else {
           newPosition = 0
       }
    }
    
    const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
            return { ...t, column_id: targetColumnId, position: newPosition }
        }
        return t
    })
    
    setTasks(updatedTasks)

    try {
      await api.put(`/tasks/${taskId}`, { column_id: targetColumnId, position: newPosition })
      const tRes = await api.get(`/tasks/?project_id=${projectId}`)
      setTasks((tRes.data || []).sort((a: Task, b: Task) => a.position - b.position))
    } catch (err) {
      console.error("Failed to move task", err)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask])
    setCreateTaskModalOpen(false)
  }

  const handleColumnsUpdated = () => {
      refreshData()
  }

  if (loading) return <div className="app-layout"><Sidebar /><main className="main-area">Загрузка...</main></div>
  if (error) return <div className="app-layout"><Sidebar /><main className="main-area"><div className="error">{error}</div></main></div>
  if (!project) return <div className="app-layout"><Sidebar /><main className="main-area">Проект не найден</main></div>

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <header className="main-header" style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' }}>{project.name}</h1>
            <p style={{ color: '#64748b', margin: 0 }}>{project.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn secondary" onClick={() => setEditColumnsModalOpen(true)}>Ред. колонки</button>
            <button className="btn" onClick={() => setCreateTaskModalOpen(true)}>Создать задачу</button>
          </div>
        </header>

        <div className="kanban-board">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="kanban-column"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <h3 className="column-header">
                {col.name}
              </h3>
              <div className="column-content">
                {tasks.filter(t => t.column_id === col.id).map(task => (
                  <div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedTask(task)}
                    style={{ cursor: 'pointer', position: 'relative' }}
                  >
                    <button 
                        draggable="false"
                        style={{
                            position: 'absolute', 
                            top: '8px', 
                            right: '8px', 
                            background: 'transparent', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: '#64748b',
                            padding: '4px',
                            zIndex: 10,
                            fontSize: '16px',
                            lineHeight: 1
                        }}
                        onMouseDown={(e) => { 
                            e.stopPropagation(); 
                            e.preventDefault(); // This stops the drag from starting
                        }}
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedTask(task); 
                        }}
                    >
                        ✎
                    </button>
                    <div className="task-title" style={{paddingRight: '20px'}}>{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-meta">
                       <span className="task-id">#{task.id}</span>
                       {task.priority && <span className="task-priority">{task.priority}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <CreateTaskModal 
        open={createTaskModalOpen} 
        onClose={() => setCreateTaskModalOpen(false)} 
        onCreated={handleTaskCreated} 
        projectId={projectId || ''} 
        columns={columns} 
        projectUsers={(() => {
          const allUsers = [...(project.users || [])];
          if (project.creator) {
            if (!allUsers.find((u: any) => u.id === project.creator.id)) {
              allUsers.push(project.creator);
            }
          }
          return allUsers;
        })()}
      />
      <EditColumnsModal
        open={editColumnsModalOpen}
        onClose={() => setEditColumnsModalOpen(false)}
        columns={columns}
        onUpdate={handleColumnsUpdated}
        projectId={projectId || ''}
      />
    </div>
  )
}
