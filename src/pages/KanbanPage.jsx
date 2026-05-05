import { useState } from 'react'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, STATUS_CONFIG, getBadgeClass, formatDate } from '../lib/utils'
import TaskModal from '../components/TaskModal'

function KanbanCard({ task, onClick, onDelete }) {
  const { moveTask } = useStore()
  const [dragging, setDragging] = useState(false)

  return (
    <div
      className={`kanban-card${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={e => { setDragging(true); e.dataTransfer.setData('taskId', task.id) }}
      onDragEnd={() => setDragging(false)}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'var(--text-primary)', flex: 1 }}>{task.title}</p>
        <button
          className="btn btn-ghost btn-icon"
          style={{ width: 24, height: 24, padding: 0, flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {task.module && (
        <div style={{ marginBottom: 6 }}>
          <span className="tag">{task.module}</span>
        </div>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {task.tags.slice(0, 3).map(tag => {
            const TAG_COLORS = { bug: '#ef4444', feature: '#0ea5e9', urgent: '#f59e0b', blocked: '#dc2626', review: '#8b5cf6', design: '#ec4899', api: '#06b6d4', mobile: '#10b981', docs: '#84cc16' }
            const c = TAG_COLORS[tag] || '#6b7280'
            return <span key={tag} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c, background: `${c}15`, border: `1px solid ${c}30`, padding: '1px 5px', borderRadius: 10 }}>#{tag}</span>
          })}
          {task.tags.length > 3 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{task.tags.length - 3}</span>}
        </div>
      )}

      {/* Subtask progress */}
      {task.subtasks?.length > 0 && (() => {
        const done = task.subtasks.filter(s => s.done).length
        const pct = Math.round(done / task.subtasks.length * 100)
        return (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>
              <span>{done}/{task.subtasks.length} subtasks</span><span>{pct}%</span>
            </div>
            <div className="progress-bar" style={{ height: 3 }}>
              <div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} />
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{task.owner}</span>
          {task.comments?.length > 0 && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
              💬 {task.comments.length}
            </span>
          )}
        </div>
        {task.dueDate && (
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      {task.priority === 'High' && (
        <div style={{ width: 3, height: '100%', position: 'absolute', left: 0, top: 0, background: 'var(--red)', borderRadius: '4px 0 0 4px' }} />
      )}
    </div>
  )
}

function KanbanColumn({ status, tasks, onTaskClick, onAdd, onDelete }) {
  const { moveTask } = useStore()
  const [dragOver, setDragOver] = useState(false)
  const cfg = STATUS_CONFIG[status]

  const handleDrop = (e) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) moveTask(taskId, status)
    setDragOver(false)
  }

  return (
    <div className="kanban-col">
      <div className="kanban-col-header" style={{ borderTop: `2px solid ${cfg.color}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: cfg.color }}>{status}</span>
          <span style={{
            fontSize: 10, background: cfg.bg, color: cfg.color,
            padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)'
          }}>{tasks.length}</span>
        </div>
        <button className="btn btn-ghost btn-icon" style={{ width: 22, height: 22, padding: 0 }} onClick={() => onAdd(status)}>
          <Plus size={12} />
        </button>
      </div>

      <div
        className={`kanban-col-body${dragOver ? ' drag-over' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {tasks.map(task => (
          <div key={task.id} style={{ position: 'relative' }}>
            <KanbanCard task={task} onClick={() => onTaskClick(task)} onDelete={onDelete} />
          </div>
        ))}
        {tasks.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  )
}

export default function KanbanPage() {
  const { getProjectTasks, deleteTask } = useStore()
  const tasks = getProjectTasks()
  const [modal, setModal] = useState(null)

  const handleDelete = (id) => { if (confirm('Delete this task?')) deleteTask(id) }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h2 className="section-title">Kanban Board</h2>
          <p className="section-sub">{tasks.length} tasks total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> New Task
        </button>
      </div>

      <div className="kanban-board" style={{ flex: 1, overflow: 'auto' }}>
        {STATUSES.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            onTaskClick={task => setModal(task)}
            onAdd={status => setModal({ status })}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {modal !== null && (
        <TaskModal
          task={modal?.id ? modal : null}
          defaultStatus={modal?.status || 'Open'}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
