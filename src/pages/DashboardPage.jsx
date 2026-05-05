import { useMemo, useState, useRef, useEffect } from 'react'
import { Download, X, ChevronDown } from 'lucide-react'
import { useStore } from '../store'
import { calcProductivity, getBadgeClass, formatDate, getDueDateColor, STATUS_CONFIG } from '../lib/utils'
import * as XLSX from 'xlsx'
import TaskModal from '../components/TaskModal'

const CARD_CONFIGS = {
  total:      { label: 'Total Tasks',  sub: 'in this project', color: 'var(--text-primary)' },
  inProgress: { label: 'In Progress',  sub: 'active tasks',    color: 'var(--accent)'       },
  done:       { label: 'Done',         sub: 'completed',       color: 'var(--green)'        },
  overdue:    { label: 'Overdue',      sub: 'past due date',   color: 'var(--red)'          },
}

function TaskListPanel({ cardKey, tasks, onClose, onTaskClick }) {
  const cfg = CARD_CONFIGS[cardKey]
  const panelRef = useRef()

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [cardKey])

  const TC = { bug: '#ef4444', feature: '#0ea5e9', urgent: '#f59e0b', blocked: '#dc2626', review: '#8b5cf6', design: '#ec4899', api: '#06b6d4', mobile: '#10b981', docs: '#84cc16' }

  return (
    <div ref={panelRef} className="card" style={{ padding: 0, overflow: 'hidden', border: `1px solid ${cfg.color}40`, animation: 'slideDown 0.2s ease' }}>
      <style>{`@keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Panel Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{cfg.label}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, padding: '1px 8px', borderRadius: 10, background: `${cfg.color}18`, color: cfg.color }}>
            {tasks.length}
          </span>
        </div>
        <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26, padding: 0 }} onClick={onClose}>
          <X size={13} />
        </button>
      </div>

      {/* Task rows */}
      {tasks.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          No tasks in this group
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Task</th>
              <th>Owner</th>
              <th>Module</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
              {cardKey === 'done' && <th>Date Done</th>}
              {cardKey === 'overdue' && <th>Overdue by</th>}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const overdueDays = cardKey === 'overdue' && task.dueDate
                ? Math.ceil((new Date() - new Date(task.dueDate)) / 86400000)
                : null
              return (
                <tr key={task.id} style={{ cursor: 'pointer' }} onClick={() => onTaskClick(task)}>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, width: 36 }}>{i + 1}</td>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{task.title}</div>
                    {task.tags?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                        {task.tags.slice(0, 3).map(tag => {
                          const c = TC[tag] || '#6b7280'
                          return <span key={tag} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: c, background: `${c}15`, padding: '1px 5px', borderRadius: 10 }}>#{tag}</span>
                        })}
                      </div>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{task.owner || '—'}</td>
                  <td>{task.module ? <span className="tag">{task.module}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td><span className={getBadgeClass(task.status)}>{task.status}</span></td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 500, color: task.priority === 'High' ? 'var(--red)' : task.priority === 'Medium' ? 'var(--amber)' : 'var(--text-muted)' }}>
                      {task.priority || '—'}
                    </span>
                  </td>
                  <td style={{ color: getDueDateColor(task.dueDate), fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                    {formatDate(task.dueDate)}
                  </td>
                  {cardKey === 'done' && (
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                      {task.dateDone ? formatDate(task.dateDone) : '—'}
                    </td>
                  )}
                  {cardKey === 'overdue' && (
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                        +{overdueDays}d
                      </span>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { getProjectTasks, projects, activeProjectId } = useStore()
  const tasks = getProjectTasks()
  const project = projects.find(p => p.id === activeProjectId)
  const [activeCard, setActiveCard] = useState(null)
  const [editTask, setEditTask] = useState(null)

  const stats = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'Cancel')
    const done = tasks.filter(t => t.status === 'Done')
    const inProgress = tasks.filter(t => t.status === 'In Progress')
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.status === 'Done' || t.status === 'Cancel') return false
      return new Date(t.dueDate) < new Date()
    })
    const score = calcProductivity(tasks)
    const ownerMap = {}
    tasks.forEach(t => {
      if (!t.owner) return
      if (!ownerMap[t.owner]) ownerMap[t.owner] = { total: 0, done: 0 }
      ownerMap[t.owner].total++
      if (t.status === 'Done') ownerMap[t.owner].done++
    })
    const statusMap = {}
    tasks.forEach(t => { statusMap[t.status] = (statusMap[t.status] || 0) + 1 })
    const moduleMap = {}
    tasks.forEach(t => { if (!t.module) return; moduleMap[t.module] = (moduleMap[t.module] || 0) + 1 })

    return {
      total: tasks.length, done: done.length, inProgress: inProgress.length,
      overdue: overdue.length, score, ownerMap, statusMap, moduleMap, active: active.length,
      taskGroups: {
        total: tasks,
        inProgress,
        done,
        overdue,
      }
    }
  }, [tasks])

  const handleCardClick = (key) => {
    setActiveCard(prev => prev === key ? null : key)
  }

  const formatDateLocal = (iso) => {
    if (!iso) return ''
    try { return new Date(iso).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) }
    catch { return iso }
  }

  const exportExcel = () => {
    const data = tasks.map(t => ({
      Title: t.title,
      Owner: t.owner || '',
      Module: t.module || '',
      Status: t.status,
      Priority: t.priority || '',
      Tags: (t.tags || []).join(', '),
      'Start Date': t.startDate || '',
      'Due Date': t.dueDate || '',
      'Date Done': t.dateDone ? formatDateLocal(t.dateDone) : '',
      'Subtasks Total': (t.subtasks || []).length,
      'Subtasks Done': (t.subtasks || []).filter(s => s.done).length,
      Comments: (t.comments || []).length,
      Description: t.description || '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [
      { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
      { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 40 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks')
    XLSX.writeFile(wb, `${project?.name || 'tasks'}-export-${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const metricCards = [
    { key: 'total',      label: 'Total Tasks',  sub: 'in this project', value: stats.total,      color: 'var(--text-primary)' },
    { key: 'inProgress', label: 'In Progress',  sub: 'active tasks',    value: stats.inProgress, color: 'var(--accent)'       },
    { key: 'done',       label: 'Done',         sub: 'completed',       value: stats.done,       color: 'var(--green)'        },
    { key: 'overdue',    label: 'Overdue',      sub: 'past due date',   value: stats.overdue,    color: stats.overdue > 0 ? 'var(--red)' : 'var(--text-muted)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title">Dashboard</h2>
          <p className="section-sub">{project?.name} — Overview</p>
        </div>
        <button className="btn" onClick={exportExcel}><Download size={14} /> Export Excel</button>
      </div>

      {/* Clickable Metric Cards */}
      <div className="metric-grid">
        {metricCards.map(card => {
          const isActive = activeCard === card.key
          return (
            <div
              key={card.key}
              className="metric-card"
              onClick={() => handleCardClick(card.key)}
              style={{
                cursor: 'pointer',
                border: `1px solid ${isActive ? card.color : 'var(--border)'}`,
                outline: isActive ? `2px solid ${card.color}30` : 'none',
                transition: 'all 0.15s',
                position: 'relative',
                userSelect: 'none',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = `${card.color}70` }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <div className="metric-label">{card.label}</div>
              <div className="metric-value" style={{ color: card.color }}>{card.value}</div>
              <div className="metric-sub" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{card.sub}</span>
                <ChevronDown size={12} style={{ color: card.color, opacity: 0.7, transform: isActive ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Inline Task List Panel */}
      {activeCard && (
        <TaskListPanel
          cardKey={activeCard}
          tasks={stats.taskGroups[activeCard]}
          onClose={() => setActiveCard(null)}
          onTaskClick={(task) => setEditTask(task)}
        />
      )}

      {/* Productivity Score */}
      <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--bg-hover)" strokeWidth="8" />
            <circle cx="40" cy="40" r="32" fill="none" stroke="var(--accent)" strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 32 * stats.score / 100} ${2 * Math.PI * 32}`}
              strokeLinecap="round" transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dasharray 1s' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 16 }}>
            {stats.score}%
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Productivity Score</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            {stats.done} of {stats.active} active tasks completed
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="progress-bar" style={{ width: 200 }}>
              <div className="progress-fill" style={{ width: `${stats.score}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Status Breakdown + Owner Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Status Breakdown</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const count = stats.statusMap[status] || 0
              const pct = stats.total > 0 ? Math.round(count / stats.total * 100) : 0
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 12, width: 80, color: cfg.color, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{status}</div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Owner Performance</div>
          {Object.keys(stats.ownerMap).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No owner data</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(stats.ownerMap).map(([owner, data]) => {
                const pct = Math.round(data.done / data.total * 100)
                return (
                  <div key={owner}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{owner}</span>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{data.done}/{data.total} · {pct}%</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Module Workload */}
      {Object.keys(stats.moduleMap).length > 0 && (
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Workload by Module</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(stats.moduleMap).sort((a, b) => b[1] - a[1]).map(([mod, count]) => (
              <div key={mod} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '8px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: 'var(--accent)' }}>{count}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{mod}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editTask && <TaskModal task={editTask} onClose={() => setEditTask(null)} />}
    </div>
  )
}
