import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, RotateCcw, Zap, Calendar, MessageCircle } from 'lucide-react'
import { useStore } from '../store'
import { formatDate, getBadgeClass } from '../lib/utils'

const API_URL = 'https://api.anthropic.com/v1/messages'

async function callClaude(systemPrompt, userMessage) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  })
  const data = await response.json()
  return data.content?.[0]?.text || 'ขอโทษครับ ไม่สามารถตอบได้ขณะนี้'
}

function buildTaskContext(tasks) {
  return tasks.map(t => `- [${t.status}] ${t.title} | Owner: ${t.owner || 'N/A'} | Priority: ${t.priority || 'N/A'} | Due: ${t.dueDate || 'N/A'} | Module: ${t.module || 'N/A'}`).join('\n')
}

export default function AIPage() {
  const { getProjectTasks, projects, activeProjectId } = useStore()
  const tasks = getProjectTasks()
  const project = projects.find(p => p.id === activeProjectId)
  const [tab, setTab] = useState('chat')
  const [messages, setMessages] = useState([
    { role: 'ai', text: `สวัสดีครับ! ผม AI Assistant สำหรับ ${project?.name || 'project'} ของคุณ\n\nถามผมได้เลย เช่น:\n• "วันนี้ Golf ควรทำอะไร"\n• "งานสำคัญที่สุดคืออะไร"\n• "งานไหน overdue บ้าง"` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dailyPlan, setDailyPlan] = useState(null)
  const [suggestions, setSuggestions] = useState(null)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const systemPrompt = `You are a smart project management AI assistant for "${project?.name || 'Golf Task App'}". 
Current date: ${new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}.
Always respond in Thai language. Be concise, helpful, and action-oriented.

Current tasks:
${buildTaskContext(tasks)}

Rules:
- Always base answers on the actual task data above
- For scheduling, use 09:00 start, 1-2 hours per task
- Prioritize by: deadline soon > high priority > in progress
- Format time as HH:MM - HH:MM → Task name`

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const reply = await callClaude(systemPrompt, userMsg)
      setMessages(m => [...m, { role: 'ai', text: reply }])
    } catch {
      setMessages(m => [...m, { role: 'ai', text: '❌ ไม่สามารถเชื่อมต่อ AI ได้ กรุณาลองใหม่อีกครั้ง' }])
    }
    setLoading(false)
  }

  const generateDailyPlan = async () => {
    setLoading(true)
    setDailyPlan(null)
    try {
      const prompt = `สร้างแผนงานประจำวันสำหรับวันนี้ โดย:
1. เลือกงานที่ควรทำวันนี้ (3-6 งาน)
2. จัดตารางเวลา เริ่ม 09:00 น.
3. ให้เวลาแต่ละงาน 1-2 ชั่วโมง ตามความซับซ้อน
4. จัดลำดับ: deadline ใกล้ก่อน, priority สูงก่อน, งาน in progress ก่อน

ตอบในรูปแบบ JSON เท่านั้น:
{"plan": [{"time": "09:00 - 10:30", "task": "ชื่องาน", "reason": "เหตุผล", "priority": "High/Medium/Low"}], "summary": "สรุปแผนวันนี้"}

ตอบเป็น JSON ล้วนๆ ไม่มี markdown`

      const reply = await callClaude(systemPrompt, prompt)
      const clean = reply.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setDailyPlan(parsed)
    } catch (e) {
      setDailyPlan({ error: 'ไม่สามารถสร้างแผนได้ กรุณาลองใหม่' })
    }
    setLoading(false)
  }

  const generateSuggestions = async () => {
    setLoading(true)
    setSuggestions(null)
    try {
      const prompt = `วิเคราะห์งานทั้งหมดและแนะนำ:
1. งานที่ควรทำก่อน (top 3)
2. งานที่มีความเสี่ยง (deadline ใกล้หรือเลยกำหนด)
3. workload ของแต่ละ owner

ตอบ JSON เท่านั้น:
{"topPriority": [{"id": "task_id_or_name", "title": "ชื่องาน", "reason": "เหตุผล"}], "atRisk": [{"title": "ชื่องาน", "risk": "เหตุผล"}], "ownerLoad": [{"owner": "ชื่อ", "load": "Heavy/Medium/Light", "suggestion": "แนะนำ"}]}

ตอบ JSON ล้วนๆ`

      const reply = await callClaude(systemPrompt, prompt)
      const clean = reply.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setSuggestions(parsed)
    } catch {
      setSuggestions({ error: 'ไม่สามารถวิเคราะห์ได้ กรุณาลองใหม่' })
    }
    setLoading(false)
  }

  const priorityColor = { High: 'var(--red)', Medium: 'var(--amber)', Light: 'var(--green)', Heavy: 'var(--red)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="var(--accent)" />
        </div>
        <div>
          <h2 className="section-title">AI Assistant</h2>
          <p className="section-sub">Powered by Claude · {tasks.length} tasks loaded</p>
        </div>
      </div>

      <div className="tab-bar">
        <button className={`tab-btn${tab === 'chat' ? ' active' : ''}`} onClick={() => setTab('chat')}><MessageCircle size={13} style={{ display: 'inline', marginRight: 4 }} />AI Chat</button>
        <button className={`tab-btn${tab === 'plan' ? ' active' : ''}`} onClick={() => setTab('plan')}><Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />Daily Plan</button>
        <button className={`tab-btn${tab === 'suggest' ? ' active' : ''}`} onClick={() => setTab('suggest')}><Zap size={13} style={{ display: 'inline', marginRight: 4 }} />Smart Suggest</button>
      </div>

      {/* CHAT */}
      {tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 400 }}>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 12 }}>
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-ai'}`}
                style={{ whiteSpace: 'pre-wrap', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="ai-thinking ai-msg-ai" style={{ alignSelf: 'flex-start' }}>
                <div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder='พิมพ์ถามได้เลย เช่น "วันนี้ควรทำอะไร"'
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              disabled={loading}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['วันนี้ Golf ควรทำอะไร', 'งานสำคัญที่สุดคืออะไร', 'งานไหน overdue บ้าง', 'สรุป progress ให้หน่อย'].map(q => (
              <button key={q} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { setInput(q); }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DAILY PLAN */}
      {tab === 'plan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={generateDailyPlan} disabled={loading}>
              <Calendar size={14} /> {loading ? 'Generating...' : 'Generate Today\'s Plan'}
            </button>
            {dailyPlan && <button className="btn btn-ghost" onClick={generateDailyPlan}><RotateCcw size={14} /> Replan</button>}
          </div>

          {loading && !dailyPlan && (
            <div className="card">
              <div className="ai-thinking"><div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" /><span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 13 }}>AI กำลังวางแผนให้...</span></div>
            </div>
          )}

          {dailyPlan?.error && <div className="card"><p style={{ color: 'var(--red)' }}>{dailyPlan.error}</p></div>}

          {dailyPlan?.plan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dailyPlan.summary && (
                <div className="card" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(14,165,233,0.2)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-primary)' }}>{dailyPlan.summary}</p>
                </div>
              )}
              {dailyPlan.plan.map((item, i) => (
                <div key={i} className="card-elevated" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent)', minWidth: 110, paddingTop: 2 }}>{item.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{item.task}</div>
                    {item.reason && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{item.reason}</div>}
                  </div>
                  {item.priority && (
                    <span style={{ fontSize: 11, color: priorityColor[item.priority] || 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>{item.priority}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMART SUGGEST */}
      {tab === 'suggest' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={generateSuggestions} disabled={loading}>
              <Zap size={14} /> {loading ? 'Analyzing...' : 'Analyze & Suggest'}
            </button>
          </div>

          {loading && !suggestions && (
            <div className="card">
              <div className="ai-thinking"><div className="ai-dot" /><div className="ai-dot" /><div className="ai-dot" /><span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 13 }}>AI กำลังวิเคราะห์งาน...</span></div>
            </div>
          )}

          {suggestions?.error && <div className="card"><p style={{ color: 'var(--red)' }}>{suggestions.error}</p></div>}

          {suggestions && !suggestions.error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {suggestions.topPriority?.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--amber)' }}>⚡</span> ทำก่อนเลย (Top Priority)
                  </div>
                  {suggestions.topPriority.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < suggestions.topPriority.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', paddingTop: 2 }}>0{i + 1}</span>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.atRisk?.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--red)' }}>⚠</span> งานที่มีความเสี่ยง
                  </div>
                  {suggestions.atRisk.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < suggestions.atRisk.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--red)', marginTop: 2 }}>{item.risk}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {suggestions.ownerLoad?.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Owner Workload</div>
                  {suggestions.ownerLoad.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < suggestions.ownerLoad.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontWeight: 500, fontSize: 13 }}>{item.owner}</span>
                          <span style={{ fontSize: 11, color: priorityColor[item.load] || 'var(--text-muted)', fontWeight: 500 }}>{item.load}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.suggestion}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
