import React, { useState, useEffect } from 'react'
import api from '../api/client'
import CreateColumnModal from './CreateColumnModal' // Import CreateColumnModal

type Column = { id: number; name: string; position: number }

type Props = {
  open: boolean
  onClose: () => void
  columns: Column[]
  onUpdate: () => void
  projectId: string // Add projectId to props
}

export default function EditColumnsModal({ open, onClose, columns, onUpdate, projectId }: Props) {
  const [items, setItems] = useState<Column[]>([])
  const [loading, setLoading] = useState(false)
  const [createColumnModalOpen, setCreateColumnModalOpen] = useState(false) // State for inner modal

  useEffect(() => {
    if (open) {
        // Deep copy to avoid mutating props
        setItems(columns.map(c => ({...c})).sort((a,b) => a.position - b.position))
    }
  }, [open, columns])

  if (!open) return null

  const moveUp = (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index - 1]
    newItems[index - 1] = temp
    setItems(newItems)
  }

  const moveDown = (index: number) => {
    if (index === items.length - 1) return
    const newItems = [...items]
    const temp = newItems[index]
    newItems[index] = newItems[index + 1]
    newItems[index + 1] = temp
    setItems(newItems)
  }

  const handleNameChange = (index: number, val: string) => {
      const newItems = [...items]
      newItems[index] = { ...newItems[index], name: val }
      setItems(newItems)
  }
  
  const handleDelete = async (id: number) => {
      if (!window.confirm("Вы уверены? Удаление колонки удалит ВСЕ задачи в ней!")) return
      try {
          await api.delete(`/columns/${id}`)
          setItems(items.filter(c => c.id !== id))
          onUpdate() // Refresh parent
      } catch(e) {
          alert("Ошибка удаления")
      }
  }

  const handleSave = async () => {
      setLoading(true)
      try {
          const promises = items.map((col, index) => {
              return api.put(`/columns/${col.id}`, { position: index, name: col.name })
          })
          
          await Promise.all(promises)
          onUpdate()
          onClose()
      } catch (e) {
          console.error(e)
          alert("Ошибка сохранения")
      } finally {
          setLoading(false)
      }
  }

  const handleColumnCreated = (newColumn: Column) => {
    setItems([...items, newColumn].sort((a,b) => a.position - b.position))
    setCreateColumnModalOpen(false)
    onUpdate() // Refresh parent
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{maxWidth: '500px'}}>
        <h3>Редактировать колонки</h3>
        <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto'}}>
            {items.map((col, idx) => (
                <div key={col.id} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                    <input 
                        value={col.name} 
                        onChange={e => handleNameChange(idx, e.target.value)} 
                        className="form-input"
                        style={{flex: 1}}
                    />
                    <button type="button" className="btn secondary" onClick={() => moveUp(idx)} disabled={idx === 0}>↑</button>
                    <button type="button" className="btn secondary" onClick={() => moveDown(idx)} disabled={idx === items.length - 1}>↓</button>
                    <button type="button" className="btn secondary" onClick={() => handleDelete(col.id)} style={{color: '#b91c1c', borderColor: '#b91c1c'}}>X</button>
                </div>
            ))}
            {items.length === 0 && <div style={{color: '#64748b', textAlign: 'center'}}>Нет колонок</div>}
        </div>
        <div className="modal-actions" style={{marginTop: '20px', justifyContent: 'space-between'}}>
            <button className="btn secondary" onClick={() => setCreateColumnModalOpen(true)}>Добавить новую колонку</button>
            <div style={{display: 'flex', gap: '8px'}}>
                <button className="btn secondary" onClick={onClose} disabled={loading}>Отмена</button>
                <button className="btn" onClick={handleSave} disabled={loading}>{loading ? 'Сохранение...' : 'Сохранить'}</button>
            </div>
        </div>
        <CreateColumnModal
            open={createColumnModalOpen}
            onClose={() => setCreateColumnModalOpen(false)}
            onCreated={handleColumnCreated}
            projectId={projectId}
        />
      </div>
    </div>
  )
}
