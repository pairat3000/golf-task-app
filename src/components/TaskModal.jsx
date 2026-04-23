import { useState, useEffect, useRef } from 'react'
import {
  X, Check, Plus, Trash2, MessageSquare, Tag, CheckSquare,
  ChevronRight, Send, Hash
} from 'lucide-react'
import { useStore } from '../store'
import { STATUSES, PRIORITIES, STATUS_CONFIG } from '../lib/utils'
import { format } from 'date-fns'

const MODULES = ['Frontend', 'Backend', 'QA', 'Design', 'DevOps', 'Research', 'Marketing', 'Other']
const PRESET_TAGS = ['bug', 'feature', 'urgent', 'blocked', 'review', 'design', 'api', 'mobile', 'docs']
const TAG_COLORS = { bug: '#ef4444', feature: '#0ea5e9', urgent: '#f59e0b', blocked: '#dc2626', review: '#8b5cf6', design: '#ec4899', api: '#06b6d4', mobile: '#10b981', docs: '#84cc16' }
const getTagColor = (tag) => TAG_COLORS[tag] || '#6b7280'

function InfoTab({ form, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="form-group">
        <label className="form-label">Task Title *</label>
        <input className="input" placeholder="Enter task title..." value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Owner</label>
          <input className="input" value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="Owner name" />
        </div>
        <div className="form-group">
          <label className="form-label">Module / Group</label>
          <select className="input select" value={form.module} onChange={e => set('module', e.target.value)}>
            <option value="">— Select —</option>
            {MODULES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="input select" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="input select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input type="date" className="input" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="input" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
      </div>
      {form.dateDone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--green-dim)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <div>
            <div style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Done</div>
            <div style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {new Date(form.dateDone).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="input textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Task details..." />
      </div>
    </div>
  )
}

function SubtasksTab({ taskId, subtasks = [] }) {
  const { addSubtask, toggleSubtask, deleteSubtask, updateSubtask } = useStore()
  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef()

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addSubtask(taskId, newTitle.trim())
    setNewTitle('')
    inputRef.current?.focus()
  }

  const doneCount = subtasks.filter(s => s.done).length
  const pct = subtasks.length > 0 ? Math.round(doneCount / subtasks.length * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {subtasks.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{doneCount}/{subtasks.length} completed</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{pct}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%`, background: 'var(--green)' }} /></div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {subtasks.map(st => (
          <div key={st.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <button onClick={() => toggleSubtask(taskId, st.id)} style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${st.done ? 'var(--green)' : 'var(--border-light)'}`, background: st.done ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
              {st.done && <Check size={11} color="#fff" />}
            </button>
            {editingId === st.id ? (
              <input className="input" style={{ flex: 1, padding: '2px 6px', fontSize: 13 }} value={editText} autoFocus onChange={e => setEditText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { updateSubtask(taskId, st.id, editText); setEditingId(null) } if (e.key === 'Escape') setEditingId(null) }}
                onBlur={() => { updateSubtask(taskId, st.id, editText); setEditingId(null) }} />
            ) : (
              <span style={{ flex: 1, fontSize: 13, cursor: 'pointer', textDecoration: st.done ? 'line-through' : 'none', color: st.done ? 'var(--text-muted)' : 'var(--text-primary)' }}
                onDoubleClick={() => { setEditingId(st.id); setEditText(st.title) }}>{st.title}</span>
            )}
            <button className="btn btn-ghost btn-icon" style={{ width: 22, height: 22, padding: 0, opacity: 0.5 }} onClick={() => deleteSubtask(taskId, st.id)}><Trash2 size={11} /></button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input ref={inputRef} className="input" placeholder="Add subtask... (Enter to add)" value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} style={{ flex: 1 }} />
        <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={!newTitle.trim()}><Plus size={13} /></button>
      </div>

      {subtasks.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Double-click a subtask to edit</p>}
    </div>
  )
}

function TagsTab({ taskId, tags = [] }) {
  const { addTag, removeTag } = useStore()
  const [input, setInput] = useState('')

  const handleAdd = (tag) => {
    const t = (tag || input).trim().toLowerCase().replace(/\s+/g, '-')
    if (!t || tags.includes(t)) return
    addTag(taskId, t)
    setInput('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div className="form-label" style={{ marginBottom: 8 }}>Current Tags</div>
        {tags.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No tags yet</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map(tag => (
              <div key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${getTagColor(tag)}18`, border: `1px solid ${getTagColor(tag)}40`, fontSize: 12, fontFamily: 'var(--font-mono)', color: getTagColor(tag) }}>
                <Hash size={10} />{tag}
                <button onClick={() => removeTag(taskId, tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', opacity: 0.7, lineHeight: 1, marginLeft: 2, fontSize: 14 }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <div className="form-label" style={{ marginBottom: 8 }}>Add Tag</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Type tag name..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={() => handleAdd()} disabled={!input.trim()}><Plus size={13} /></button>
        </div>
      </div>
      <div>
        <div className="form-label" style={{ marginBottom: 8 }}>Quick Add</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PRESET_TAGS.filter(t => !tags.includes(t)).map(tag => (
            <button key={tag} onClick={() => handleAdd(tag)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, cursor: 'pointer', background: 'var(--bg-elevated)', border: '1px solid var(--border-light)', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = getTagColor(tag); e.currentTarget.style.color = getTagColor(tag) }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-secondary)' }}>
              <Hash size={10} />{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function CommentsTab({ taskId, comments = [] }) {
  const { addComment, deleteComment } = useStore()
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('Golf')
  const bottomRef = useRef()

  const handleSend = () => {
    if (!text.trim()) return
    addComment(taskId, text.trim(), author)
    setText('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
            <MessageSquare size={28} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            No comments yet
          </div>
        ) : (
          comments.map(c => (
            <div key={c.id} style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, color: 'var(--accent)' }}>
                    {c.author?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{c.author}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{format(new Date(c.createdAt), 'dd MMM HH:mm')}</span>
                  <button className="btn btn-ghost btn-icon" style={{ width: 20, height: 20, padding: 0, opacity: 0.4 }} onClick={() => deleteComment(taskId, c.id)}><Trash2 size={10} /></button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{c.text}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          <input className="input" style={{ width: 120 }} placeholder="Your name" value={author} onChange={e => setAuthor(e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>commenting as</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea className="input textarea" style={{ flex: 1, minHeight: 60, resize: 'none' }} placeholder="Write a comment... (Ctrl+Enter to send)" value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSend() }} />
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end', padding: '8px 12px' }} onClick={handleSend} disabled={!text.trim()}><Send size={14} /></button>
        </div>
      </div>
    </div>
  )
}

export default function TaskModal({ task, onClose, defaultStatus }) {
  const { addTask, updateTask, tasks } = useStore()
  const liveTask = task?.id ? tasks.find(t => t.id === task.id) : null
  const [form, setForm] = useState({ title: '', owner: 'Golf', module: '', status: defaultStatus || 'Open', priority: 'Medium', startDate: '', dueDate: '', description: '', ...(liveTask || task) })
  const [tab, setTab] = useState('info')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const isEdit = !!task?.id

  const handleSubmit = () => {
    if (!form.title.trim()) return
    if (isEdit) updateTask(task.id, { title: form.title, owner: form.owner, module: form.module, status: form.status, priority: form.priority, startDate: form.startDate, dueDate: form.dueDate, description: form.description })
    else addTask(form)
    onClose()
  }

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const statusCfg = STATUS_CONFIG[form.status] || {}
  const TABS = [
    { id: 'info', label: 'Info', icon: <ChevronRight size={13} /> },
    { id: 'subtasks', label: `Subtasks${liveTask?.subtasks?.length ? ` (${liveTask.subtasks.length})` : ''}`, icon: <CheckSquare size={13} /> },
    { id: 'tags', label: `Tags${liveTask?.tags?.length ? ` (${liveTask.tags.length})` : ''}`, icon: <Tag size={13} /> },
    { id: 'comments', label: `Comments${liveTask?.comments?.length ? ` (${liveTask.comments.length})` : ''}`, icon: <MessageSquare size={13} /> },
  ]

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header" style={{ paddingBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 className="modal-title" style={{ fontSize: 15 }}>{isEdit ? form.title || 'Edit Task' : 'New Task'}</h2>
              {isEdit && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontFamily: 'var(--font-mono)', background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.color}40` }}>{form.status}</span>}
            </div>
            {isEdit && liveTask?.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {liveTask.tags.map(tag => <span key={tag} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: getTagColor(tag) }}>#{tag}</span>)}
              </div>
            )}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {isEdit && (
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)', color: tab === t.id ? 'var(--accent)' : 'var(--text-muted)', borderBottom: `2px solid ${tab === t.id ? 'var(--accent)' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        )}

        <div className="modal-body" style={{ paddingTop: 16 }}>
          {(!isEdit || tab === 'info') && <InfoTab form={form} set={set} />}
          {isEdit && tab === 'subtasks' && <SubtasksTab taskId={task.id} subtasks={liveTask?.subtasks || []} />}
          {isEdit && tab === 'tags' && <TagsTab taskId={task.id} tags={liveTask?.tags || []} />}
          {isEdit && tab === 'comments' && <CommentsTab taskId={task.id} comments={liveTask?.comments || []} />}
        </div>

        <div className="modal-footer">
          {isEdit && tab !== 'info' ? (
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>{isEdit ? 'Save Changes' : '+ Add Task'}</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
