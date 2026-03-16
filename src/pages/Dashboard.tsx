import React, { useEffect, useState } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../api/client'
import { Link } from 'react-router-dom'
import CreateProjectModal from '../components/CreateProjectModal'
import DeleteProjectModal from '../components/DeleteProjectModal'
import { useAuth } from '../context/AuthContext'

type Project = { 
  id: number; 
  name: string; 
  description?: string;
  users?: { id: number; email: string }[] 
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { user, logout } = useAuth()

  useEffect(() => {
    let mounted = true
    api.get('/projects')
      .then(res => { if (mounted) setProjects(res.data) })
      .catch(err => {
        try {
          const status = err?.response?.status
          if (status === 401) {
            // unauthorized, force logout
            try { logout() } catch (e) { /* ignore */ }
            setError('Неавторизовано')
            return
          }
          const d = err?.response?.data
          if (d?.detail) {
            if (typeof d.detail === 'string') setError(d.detail)
            else if (Array.isArray(d.detail)) setError(d.detail.map((x: any) => x?.msg || JSON.stringify(x)).join('; '))
            else setError(JSON.stringify(d.detail))
          } else setError(err.message || JSON.stringify(d))
        } catch (e) {
          setError(err.message || 'Ошибка')
        }
      })
      .finally(() => setLoading(false))
    return () => { mounted = false }
  }, [])

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await api.get('/projects')
      setProjects(res.data)
    } catch (err: any) {
        const status = err?.response?.status
        if (status === 401) { try { logout() } catch (e) { } setError('Неавторизовано'); return }
        setError(err?.response?.data?.detail || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreated = (project: any) => {
    // append to list if present, otherwise refresh
    if (projects) setProjects([project, ...projects])
    else refresh()
  }

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
      e.preventDefault();
      e.stopPropagation();
      setProjectToDelete(project);
  }

  const handleConfirmDelete = async () => {
      if (!projectToDelete) return;
      setDeleteLoading(true);
      try {
          await api.delete(`/projects/${projectToDelete.id}`);
          setProjects(projects?.filter(p => p.id !== projectToDelete.id) || []);
          setProjectToDelete(null);
      } catch (err) {
          alert("Не удалось удалить доску");
      } finally {
          setDeleteLoading(false);
      }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-area">
        <header className="main-header">
          <h2>Мои доски</h2>
          <div className="header-actions">
            <button className="btn" onClick={() => setCreateOpen(true)}>Создать доску</button>
          </div>
        </header>

        <section className="boards-list">
          {loading && <div>Загрузка...</div>}
          {error && <div className="error">Ошибка: {error}</div>}

          {!loading && !error && (
            <>
              {projects && projects.length > 0 ? (
                <ul className="projects-grid">
                  {projects.map(p => (
                    <li key={p.id} className="project-card" style={{ position: 'relative' }}>
                      <button 
                        onClick={(e) => handleDeleteClick(e, p)}
                        className="delete-project-btn"
                        title="Удалить доску"
                      >
                        &times;
                      </button>
                      <h3><Link to={`/projects/${p.id}`}>{p.name}</Link></h3>
                      <p>{p.description}</p>
                      {p.users && p.users.length > 0 && (
                        <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#64748b' }}>
                          <strong>Участники:</strong> {p.users.length}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="no-projects">нет активных проектов</div>
              )}
            </>
          )}
        </section>
      </main>
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={handleCreated} />
      <DeleteProjectModal 
        open={!!projectToDelete} 
        onClose={() => setProjectToDelete(null)} 
        onConfirm={handleConfirmDelete} 
        projectName={projectToDelete?.name || ''} 
        loading={deleteLoading}
      />
    </div>
  )
}
