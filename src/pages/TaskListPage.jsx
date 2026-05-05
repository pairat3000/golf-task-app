import { useState, useMemo } from 'react'
import { Search, Plus, Pencil, Trash2, Filter, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, PRIORITIES, getBadgeClass, formatDate, getDueDateColor } from '../lib/utils'
import TaskModal from '../components/TaskModal'

export default function TaskListPage() {
  const { getProjectTasks, deleteTask } = useStore()
  const allTasks = getProjectTasks()
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterOwner, setFilterOwner] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState('createdAt')

  const owners = [...new Set(allTasks.map(t => t.owner).filter(Boolean))]

  const tasks = useMemo(() => {
    let list = [...allTasks]
    if (search) list = list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.owner?.toLowerCase().includes(search.toLowerCase()) || t.module?.toLowerCase().includes(search.toLowerCase()))
    if (filterStatus) list = list.filter(t => t.status === filterStatus)
    if (filterOwner) list = list.filter(t => t.owner === filterOwner)
    if (filterMonth) list = list.filter(t => t.dueDate?.startsWith(filterMonth))
    list.sort((a, b) => {
      if (sortKey === 'dueDate') return (a.dueDate || 'z') > (b.dueDate || 'z') ? 1 : -1
      if (sortKey === 'priority') { const order = { High: 0, Medium: 1, Low: 2 }; return (order[a.priority] || 1) - (order[b.priority] || 1) }
      return (b.createdAt || '') > (a.createdAt || '') ? 1 : -1
    })
    return list
  }, [allTasks, search, filterStatus, filterOwner, filterMonth, sortKey])

  const handleDelete = (id) => { if (confirm('Delete this task?')) deleteTask(id) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title">Task List</h2>
          <p className="section-sub">{tasks.length} of {allTasks.length} tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}><Plus size={14} /> New Task</button>
      </div>

      {/* Search & Filter bar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <Search size={14} />
          <input className="input search-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className={`btn ${showFilters ? 'btn-primary' : ''}`} onClick={() => setShowFilters(s => !s)}>
          <Filter size={14} /> Filters {showFilters ? '▲' : '▼'}
        </button>
        <select className="input" style={{ width: 'auto' }} value={sortKey} onChange={e => setSortKey(e.target.value)}>
          <option value="createdAt">Sort: Latest</option>
          <option value="dueDate">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {showFilters && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 14, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Status</label>
            <select className="input select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Owner</label>
            <select className="input select" value={filterOwner} onChange={e => setFilterOwner(e.target.value)}>
              <option value="">All Owners</option>
              {owners.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: 140 }}>
            <label className="form-label">Month (Due)</label>
            <input type="month" className="input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => { setFilterStatus(''); setFilterOwner(''); setFilterMonth('') }}>Clear</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <Search size={40} />
            <p>No tasks found</p>
            <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => setModal({})}>+ Create first task</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Task</th>
                <th>Owner</th>
                <th>Module</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Tags</th>
                <th>Start</th>
                <th>Due</th>
                <th>Done</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => setModal(task)}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                    {task.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.description}</div>}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{task.owner || '—'}</td>
                  <td>{task.module ? <span className="tag">{task.module}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className={getBadgeClass(task.status)}>{task.status}</span></td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 500, color: task.priority === 'High' ? 'var(--red)' : task.priority === 'Medium' ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      {task.tags?.slice(0, 2).map(tag => {
                        const TC = { bug: '#ef4444', feature: '#0ea5e9', urgent: '#f59e0b', blocked: '#dc2626', review: '#8b5cf6', design: '#ec4899', api: '#06b6d4', mobile: '#10b981', docs: '#84cc16' }
                        const c = TC[tag] || '#6b7280'
                        return <span key={tag} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c, background: `${c}15`, padding: '1px 5px', borderRadius: 10 }}>#{tag}</span>
                      })}
                      {(task.tags?.length || 0) > 2 && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{task.tags.length - 2}</span>}
                      {task.subtasks?.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                          ☑ {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                        </span>
                      )}
                      {task.comments?.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>💬 {task.comments.length}</span>
                      )}
                      {!task.tags?.length && !task.subtasks?.length && !task.comments?.length && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{formatDate(task.startDate)}</td>
                  <td style={{ color: getDueDateColor(task.dueDate), fontSize: 12, fontFamily: 'var(--font-mono)' }}>{formatDate(task.dueDate)}</td>
                  <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {task.dateDone
                      ? <span style={{ color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span>✅</span>{formatDate(task.dateDone)}
                        </span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon" style={{ width: 28, height: 28, padding: 0 }}
                      onClick={e => { e.stopPropagation(); handleDelete(task.id) }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <TaskModal task={modal?.id ? modal : null} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
