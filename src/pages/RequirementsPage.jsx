import { useState, useMemo } from 'react'
import {
  Plus, X, Search, ArrowRight, Trash2, Check,
  Inbox, Eye, ThumbsUp, ThumbsDown, RefreshCw, Filter
} from 'lucide-react'
import { useStore } from '../store'
import { formatDate } from '../lib/utils'

// ─── Config ──────────────────────────────────────────────────────────────────

const REQ_STATUSES = ['Inbox', 'Reviewing', 'Approved', 'Rejected', 'Converted']
const REQ_TYPES    = ['Feature', 'Enhancement', 'Bug Fix', 'Research', 'Refactor', 'Other']
const EFFORTS      = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const IMPACTS      = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const MODULES      = ['Frontend', 'Backend', 'QA', 'Design', 'DevOps', 'Research', 'Marketing', 'Other']
const PRIORITIES   = ['High', 'Medium', 'Low']

const STATUS_CFG = {
  Inbox:     { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: Inbox,      label: 'Inbox'     },
  Reviewing: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: Eye,        label: 'Reviewing' },
  Approved:  { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: ThumbsUp,   label: 'Approved'  },
  Rejected:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: ThumbsDown, label: 'Rejected'  },
  Converted: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)',  icon: RefreshCw,  label: 'Converted' },
}

const EFFORT_SCORE  = { 'Very Low': 1, Low: 2, Medium: 3, High: 4, 'Very High': 5 }
const IMPACT_SCORE  = { 'Very Low': 1, Low: 2, Medium: 3, High: 4, 'Very High': 5 }
const PRIORITY_SCORE = { High: 3, Medium: 2, Low: 1 }

function getScore(req) {
  // Higher impact + priority, lower effort = higher score
  const impact   = IMPACT_SCORE[req.impact]   || 3
  const effort   = EFFORT_SCORE[req.effort]   || 3
  const priority = PRIORITY_SCORE[req.priority] || 2
  return Math.round(((impact * 2 + priority) / (effort + 1)) * 10)
}

function scoreColor(s) {
  if (s >= 15) return 'var(--green)'
  if (s >= 8)  return 'var(--amber)'
  return 'var(--red)'
}

// ─── Requirement Modal ────────────────────────────────────────────────────────

function ReqModal({ req, onClose }) {
  const { addRequirement, updateRequirement } = useStore()
  const isEdit = !!req?.id
  const [form, setForm] = useState({
    title: '', description: '', type: 'Feature', priority: 'Medium',
    status: 'Inbox', requestedBy: 'Golf', module: '', effort: 'Medium',
    impact: 'Medium', notes: '', ...req,
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.title.trim()) return
    if (isEdit) updateRequirement(req.id, form)
    else addRequirement(form)
    onClose()
  }

  const score = getScore(form)

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 620 }}>

        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Requirement' : 'New Requirement'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="modal-body">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="input" autoFocus placeholder="What needs to be built?" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input textarea" style={{ minHeight: 90 }} placeholder="Describe the requirement in detail. What problem does it solve?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          {/* Row 1 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="input select" value={form.type} onChange={e => set('type', e.target.value)}>
                {REQ_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Effort</label>
              <select className="input select" value={form.effort} onChange={e => set('effort', e.target.value)}>
                {EFFORTS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Impact</label>
              <select className="input select" value={form.impact} onChange={e => set('impact', e.target.value)}>
                {IMPACTS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Requested By</label>
              <input className="input" value={form.requestedBy} onChange={e => set('requestedBy', e.target.value)} placeholder="Name" />
            </div>
            <div className="form-group">
              <label className="form-label">Module</label>
              <select className="input select" value={form.module} onChange={e => set('module', e.target.value)}>
                <option value="">— Select —</option>
                {MODULES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REQ_STATUSES.filter(s => s !== 'Converted').map(s => {
                const cfg = STATUS_CFG[s]
                const active = form.status === s
                return (
                  <button key={s} onClick={() => set('status', s)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    border: `1px solid ${active ? cfg.color : 'var(--border-light)'}`,
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}>{s}</button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes / Decision Reason</label>
            <textarea className="input textarea" style={{ minHeight: 60 }} placeholder="Why approve / reject? Any conditions?" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

          {/* Score preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority Score</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 20, color: scoreColor(score) }}>{score}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>= (Impact×2 + Priority) ÷ (Effort + 1) × 10</div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title.trim()}>
            {isEdit ? 'Save Changes' : '+ Add Requirement'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Requirement Detail Side Panel ────────────────────────────────────────────

function ReqDetail({ req, onClose, onEdit, onConvert, onDelete, onStatusChange }) {
  const { tasks } = useStore()
  const cfg = STATUS_CFG[req.status] || STATUS_CFG.Inbox
  const StatusIcon = cfg.icon
  const score = getScore(req)
  const convertedTask = req.convertedTaskId ? tasks.find(t => t.id === req.convertedTaskId) : null

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
      background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', zIndex: 150,
      boxShadow: '-12px 0 40px rgba(0,0,0,0.3)',
      animation: 'slideInRight 0.2s ease',
    }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 600 }}>
                {req.status}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 10 }}>{req.type}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: scoreColor(score), fontWeight: 700 }}>Score: {score}</span>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4 }}>{req.title}</h3>
          </div>
          <button className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }} onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Priority',     value: req.priority, color: req.priority === 'High' ? 'var(--red)' : req.priority === 'Medium' ? 'var(--amber)' : 'var(--text-muted)' },
            { label: 'Effort',       value: req.effort },
            { label: 'Impact',       value: req.impact },
            { label: 'Module',       value: req.module || '—' },
            { label: 'Requested By', value: req.requestedBy || '—' },
            { label: 'Created',      value: formatDate(req.createdAt) },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '8px 10px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: color || 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {req.description && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Description</div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{req.description}</p>
          </div>
        )}

        {/* Notes */}
        {req.notes && (
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 600, marginBottom: 4 }}>📝 Notes / Decision</div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{req.notes}</p>
          </div>
        )}

        {/* Converted task link */}
        {convertedTask && (
          <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--accent-dim)', border: '1px solid rgba(14,165,233,0.2)' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>✅ Converted to Task</div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{convertedTask.title}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Status: {convertedTask.status}</p>
          </div>
        )}

        {/* Quick status change */}
        {req.status !== 'Converted' && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Change Status</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {REQ_STATUSES.filter(s => s !== req.status && s !== 'Converted').map(s => {
                const c = STATUS_CFG[s]
                return (
                  <button key={s} onClick={() => onStatusChange(req.id, s)} style={{
                    padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${c.color}60`, background: c.bg, color: c.color, fontWeight: 500,
                  }}>{s}</button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        {req.status === 'Approved' && !req.convertedTaskId && (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => onConvert(req.id)}>
            <ArrowRight size={14} /> Convert to Task
          </button>
        )}
        <button className="btn" style={{ flex: req.status === 'Approved' ? 'none' : 1 }} onClick={() => onEdit(req)}>Edit</button>
        <button className="btn btn-ghost" onClick={() => { if (confirm('Delete this requirement?')) { onDelete(req.id); onClose() } }}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── Requirement Card ─────────────────────────────────────────────────────────

function ReqCard({ req, onClick }) {
  const cfg = STATUS_CFG[req.status] || STATUS_CFG.Inbox
  const score = getScore(req)
  const StatusIcon = cfg.icon

  return (
    <div onClick={onClick} style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '14px 16px',
      cursor: 'pointer', transition: 'all 0.15s',
      borderLeft: `3px solid ${cfg.color}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = cfg.color; e.currentTarget.style.background = 'var(--bg-elevated)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.borderLeftColor = cfg.color; e.currentTarget.style.background = 'var(--bg-surface)' }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <h4 style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{req.title}</h4>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: scoreColor(score), flexShrink: 0 }}>{score}</div>
      </div>

      {/* Description preview */}
      {req.description && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {req.description}
        </p>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: cfg.bg, color: cfg.color, fontWeight: 500 }}>
          {req.status}
        </span>
        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          {req.type}
        </span>
        <span style={{ fontSize: 11, color: req.priority === 'High' ? 'var(--red)' : req.priority === 'Medium' ? 'var(--amber)' : 'var(--text-muted)', fontWeight: 500 }}>
          {req.priority}
        </span>
        {req.module && <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '1px 6px', borderRadius: 8 }}>{req.module}</span>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Effort: <span style={{ color: 'var(--text-secondary)' }}>{req.effort}</span></span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Impact: <span style={{ color: 'var(--text-secondary)' }}>{req.impact}</span></span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{req.requestedBy}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RequirementsPage() {
  const { getProjectRequirements, updateRequirement, deleteRequirement, convertRequirementToTask } = useStore()
  const reqs = getProjectRequirements()

  const [modal, setModal]         = useState(null)   // null | {} | req obj
  const [detail, setDetail]       = useState(null)   // null | req obj
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('All')
  const [sortBy, setSort]         = useState('score')
  const [showFilter, setShowFilter] = useState(false)

  const stats = useMemo(() => {
    const counts = {}
    REQ_STATUSES.forEach(s => { counts[s] = reqs.filter(r => r.status === s).length })
    return counts
  }, [reqs])

  const filtered = useMemo(() => {
    let list = [...reqs]
    if (search) list = list.filter(r =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase()) ||
      r.requestedBy?.toLowerCase().includes(search.toLowerCase())
    )
    if (filterStatus !== 'All') list = list.filter(r => r.status === filterStatus)
    if (sortBy === 'score')   list.sort((a, b) => getScore(b) - getScore(a))
    if (sortBy === 'newest')  list.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    if (sortBy === 'priority') list.sort((a, b) => PRIORITY_SCORE[b.priority] - PRIORITY_SCORE[a.priority])
    return list
  }, [reqs, search, filterStatus, sortBy])

  const handleConvert = (reqId) => {
    if (!confirm('Convert this requirement to a Task? It will appear in your Kanban board.')) return
    convertRequirementToTask(reqId)
    setDetail(r => r?.id === reqId ? { ...r, status: 'Converted' } : r)
  }

  const handleStatusChange = (id, status) => {
    updateRequirement(id, { status })
    setDetail(r => r?.id === id ? { ...r, status } : r)
  }

  // Live-sync detail panel when reqs update
  const liveDetail = detail ? reqs.find(r => r.id === detail.id) || detail : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h2 className="section-title">Requirements</h2>
          <p className="section-sub">วิเคราะห์และพิจารณาก่อน convert เป็น Task</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={14} /> New Requirement
        </button>
      </div>

      {/* ── Status Summary Pills ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('All')} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
          border: `1px solid ${filterStatus === 'All' ? 'var(--text-secondary)' : 'var(--border)'}`,
          background: filterStatus === 'All' ? 'var(--bg-hover)' : 'transparent',
          color: filterStatus === 'All' ? 'var(--text-primary)' : 'var(--text-muted)',
        }}>All <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{reqs.length}</span></button>

        {REQ_STATUSES.map(s => {
          const cfg = STATUS_CFG[s]
          const count = stats[s] || 0
          const active = filterStatus === s
          return (
            <button key={s} onClick={() => setFilter(s)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: `1px solid ${active ? cfg.color : 'var(--border)'}`,
              background: active ? cfg.bg : 'transparent',
              color: active ? cfg.color : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}>
              {s} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Search + Sort ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <Search size={14} />
          <input className="input search-input" placeholder="Search requirements..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 'auto' }} value={sortBy} onChange={e => setSort(e.target.value)}>
          <option value="score">Sort: Score ↓</option>
          <option value="newest">Sort: Newest</option>
          <option value="priority">Sort: Priority</option>
        </select>
      </div>

      {/* ── Score legend ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ fontWeight: 500 }}>Priority Score:</span>
        <span style={{ color: 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>≥15 High</span>
        <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>8–14 Medium</span>
        <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>&lt;8 Low</span>
        <span style={{ marginLeft: 4 }}>= (Impact×2 + Priority) ÷ (Effort+1) × 10</span>
      </div>

      {/* ── Card Grid ── */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📋</div>
          <p style={{ fontWeight: 500, marginBottom: 6 }}>No requirements found</p>
          <button className="btn btn-ghost" style={{ marginTop: 4 }} onClick={() => setModal({})}>+ Add first requirement</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(req => (
            <ReqCard key={req.id} req={req} onClick={() => setDetail(req)} />
          ))}
        </div>
      )}

      {/* ── Modals ── */}
      {modal !== null && (
        <ReqModal req={modal?.id ? modal : null} onClose={() => setModal(null)} />
      )}

      {liveDetail && (
        <ReqDetail
          req={liveDetail}
          onClose={() => setDetail(null)}
          onEdit={(r) => { setModal(r); setDetail(null) }}
          onConvert={handleConvert}
          onDelete={(id) => { deleteRequirement(id); setDetail(null) }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
