import { useMemo, useRef, useState } from 'react'
import { addDays, startOfMonth, endOfMonth, format, parseISO, differenceInDays, isValid, eachDayOfInterval } from 'date-fns'
import { useStore } from '../store'
import { STATUS_CONFIG, getBadgeClass, formatDate } from '../lib/utils'
import TaskModal from '../components/TaskModal'

const CELL_W = 28
const ROW_H = 40
const LABEL_W = 220

export default function TimelinePage() {
  const { getProjectTasks } = useStore()
  const tasks = getProjectTasks().filter(t => t.startDate && t.dueDate)
  const allTasks = getProjectTasks()
  const [modal, setModal] = useState(null)
  const [viewMonth, setViewMonth] = useState(() => format(new Date(), 'yyyy-MM'))

  const viewDate = useMemo(() => {
    try { return parseISO(viewMonth + '-01') } catch { return new Date() }
  }, [viewMonth])

  const days = useMemo(() => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    return eachDayOfInterval({ start, end })
  }, [viewDate])

  const timelineWidth = days.length * CELL_W

  const getBar = (task) => {
    try {
      const start = parseISO(task.startDate)
      const end = parseISO(task.dueDate)
      const monthStart = startOfMonth(viewDate)
      const monthEnd = endOfMonth(viewDate)
      if (!isValid(start) || !isValid(end)) return null
      if (end < monthStart || start > monthEnd) return null
      const clampedStart = start < monthStart ? monthStart : start
      const clampedEnd = end > monthEnd ? monthEnd : end
      const left = differenceInDays(clampedStart, monthStart) * CELL_W
      const width = Math.max((differenceInDays(clampedEnd, clampedStart) + 1) * CELL_W, CELL_W)
      return { left, width }
    } catch { return null }
  }

  const cfg = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Open']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="section-title">Timeline</h2>
          <p className="section-sub">{tasks.length} tasks with dates</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const d = new Date(viewDate); d.setMonth(d.getMonth() - 1); setViewMonth(format(d, 'yyyy-MM'))
          }}>← Prev</button>
          <input type="month" className="input" style={{ width: 'auto' }} value={viewMonth} onChange={e => setViewMonth(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={() => {
            const d = new Date(viewDate); d.setMonth(d.getMonth() + 1); setViewMonth(format(d, 'yyyy-MM'))
          }}>Next →</button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p style={{ fontSize: 15, fontWeight: 500 }}>No tasks with dates in this month</p>
            <p style={{ marginTop: 4, fontSize: 13 }}>Add start date & due date to tasks to see them here</p>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--bg-surface)', zIndex: 10 }}>
            <div style={{ width: LABEL_W, minWidth: LABEL_W, padding: '8px 12px', borderRight: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Task
            </div>
            <div style={{ display: 'flex', width: timelineWidth }}>
              {days.map(day => (
                <div key={day.toISOString()} style={{
                  width: CELL_W, minWidth: CELL_W, textAlign: 'center', padding: '8px 0 6px',
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  color: format(day, 'EEE') === 'Sun' || format(day, 'EEE') === 'Sat' ? 'var(--text-muted)' : 'var(--text-secondary)',
                  background: format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'var(--accent-dim)' : 'transparent',
                  borderLeft: '1px solid var(--border)',
                }}>
                  <div style={{ fontWeight: 600 }}>{format(day, 'd')}</div>
                  <div style={{ opacity: 0.6 }}>{format(day, 'EE')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rows */}
          {tasks.map(task => {
            const bar = getBar(task)
            const c = cfg(task.status)
            return (
              <div key={task.id} className="gantt-row" style={{ height: ROW_H }}>
                <div style={{
                  width: LABEL_W, minWidth: LABEL_W, padding: '0 12px',
                  borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', color: 'var(--text-primary)' }}
                    onClick={() => setModal(task)}
                  >{task.title}</span>
                </div>
                <div style={{ flex: 1, position: 'relative', height: '100%', overflow: 'hidden' }}>
                  {/* Today line */}
                  {(() => {
                    const todayOffset = differenceInDays(new Date(), startOfMonth(viewDate))
                    if (todayOffset >= 0 && todayOffset < days.length) {
                      return <div style={{ position: 'absolute', left: todayOffset * CELL_W + CELL_W / 2, top: 0, bottom: 0, width: 1, background: 'var(--accent)', opacity: 0.4, zIndex: 1 }} />
                    }
                  })()}

                  {bar && (
                    <div
                      className="gantt-bar"
                      style={{
                        left: bar.left,
                        width: bar.width,
                        background: c.bg,
                        border: `1px solid ${c.color}`,
                        color: c.color,
                        fontSize: 10,
                        zIndex: 2,
                      }}
                      onClick={() => setModal(task)}
                      title={`${task.title} (${formatDate(task.startDate)} → ${formatDate(task.dueDate)})`}
                    >
                      {bar.width > 50 && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</span>}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tasks without dates */}
      {allTasks.filter(t => !t.startDate || !t.dueDate).length > 0 && (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--text-secondary)' }}>Tasks without dates ({allTasks.filter(t => !t.startDate || !t.dueDate).length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allTasks.filter(t => !t.startDate || !t.dueDate).map(task => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setModal(task)}>
                <span className={getBadgeClass(task.status)}>{task.status}</span>
                <span style={{ fontSize: 13 }}>{task.title}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>click to add dates →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && <TaskModal task={modal} onClose={() => setModal(null)} />}
    </div>
  )
}
