import { useState, useRef } from 'react'
import { Download, Upload, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useStore } from '../store'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']

export default function SettingsPage() {
  const { projects, addProject, updateProject, deleteProject, activeProjectId, setActiveProject, exportData, importData } = useStore()
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editColor, setEditColor] = useState('#0ea5e9')
  const [newProject, setNewProject] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newColor, setNewColor] = useState('#0ea5e9')
  const fileRef = useRef()

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (importData(data)) alert('✅ Import สำเร็จ!')
        else alert('❌ ไฟล์ไม่ถูกต้อง')
      } catch { alert('❌ ไฟล์ JSON ไม่ถูกต้อง') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const startEdit = (p) => { setEditId(p.id); setEditName(p.name); setEditDesc(p.description || ''); setEditColor(p.color || '#0ea5e9') }
  const saveEdit = () => { updateProject(editId, { name: editName, description: editDesc, color: editColor }); setEditId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="section-sub">Manage projects, backup & restore</p>
      </div>

      {/* Projects */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Projects</div>
          <button className="btn btn-primary btn-sm" onClick={() => setNewProject(true)}><Plus size={13} /> New Project</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
              background: p.id === activeProjectId ? 'var(--accent-dim)' : 'var(--bg-elevated)',
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              {editId === p.id ? (
                <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input className="input" style={{ flex: 1, minWidth: 120 }} value={editName} onChange={e => setEditName(e.target.value)} />
                  <input className="input" style={{ flex: 1, minWidth: 120 }} placeholder="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {COLORS.map(c => (
                      <div key={c} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: editColor === c ? '2px solid white' : '2px solid transparent' }} onClick={() => setEditColor(c)} />
                    ))}
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={saveEdit}><Check size={12} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}><X size={12} /></button>
                </div>
              ) : (
                <>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#0ea5e9', flexShrink: 0 }} />
                  <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setActiveProject(p.id)}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div>}
                  </div>
                  {p.id === activeProjectId && <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>ACTIVE</span>}
                  <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26, padding: 0 }} onClick={() => startEdit(p)}><Edit2 size={12} /></button>
                  <button className="btn btn-ghost btn-icon" style={{ width: 26, height: 26, padding: 0 }} onClick={() => { if (confirm(`Delete "${p.name}"?`)) { deleteProject(p.id); if (p.id === activeProjectId && projects.length > 1) setActiveProject(projects.find(x => x.id !== p.id)?.id) } }}><Trash2 size={12} /></button>
                </>
              )}
            </div>
          ))}

          {newProject && (
            <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--accent)', background: 'var(--accent-dim)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="input" placeholder="Project name *" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
              <input className="input" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {COLORS.map(c => (
                  <div key={c} style={{ width: 20, height: 20, borderRadius: '50%', background: c, cursor: 'pointer', border: newColor === c ? '2px solid white' : '2px solid transparent' }} onClick={() => setNewColor(c)} />
                ))}
                <div style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => { setNewProject(false); setNewName('') }}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  if (!newName.trim()) return
                  addProject({ name: newName, description: newDesc, color: newColor })
                  setNewProject(false); setNewName(''); setNewDesc('')
                }}>Create</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Backup & Restore</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Download size={16} color="var(--green)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Export Backup</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>ดาวน์โหลดข้อมูลทั้งหมดเป็น .json</div>
            </div>
            <button className="btn btn-sm" onClick={exportData}><Download size={13} /> Download</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <Upload size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>Import Backup</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>โหลดข้อมูลจากไฟล์ .json</div>
            </div>
            <button className="btn btn-sm" onClick={() => fileRef.current.click()}><Upload size={13} /> Import</button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--amber-dim)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p style={{ fontSize: 12, color: 'var(--amber)' }}>⚠ การ Import จะแทนที่ข้อมูลทั้งหมดในปัจจุบัน กรุณา Export สำรองข้อมูลก่อน</p>
        </div>
      </div>

      {/* Cloud Sync info */}
      <div className="card" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(14,165,233,0.2)' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>☁ Cloud Sync</div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          เพื่อ sync ข้ามอุปกรณ์ แนะนำให้เชื่อมต่อกับ <strong>Supabase</strong> (ฟรี)<br />
          1. สร้าง project ที่ supabase.com<br />
          2. เพิ่ม VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ใน .env<br />
          3. ข้อมูลจะ sync realtime ทุก device อัตโนมัติ
        </p>
      </div>
    </div>
  )
}
