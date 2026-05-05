import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Trash2, Copy, Check, Zap, Calendar, Brain, RefreshCw } from 'lucide-react'
import { useStore } from '../store'
import { formatDate } from '../lib/utils'
import { AI_MODEL, AI_MAX_TOKENS } from '../lib/constants'

// ── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'chat',    label: 'AI Chat',       icon: Brain },
  { id: 'plan',    label: 'Daily Plan',    icon: Calendar },
  { id: 'suggest', label: 'Smart Suggest', icon: Zap },
]

const QUICK_PROMPTS = [
  'วันนี้ Golf ควรทำอะไร?',
  'Task ไหนเสี่ยงที่สุดตอนนี้?',
  'สรุป progress ของโปรเจกต์นี้',
  'แนะนำการจัดลำดับความสำคัญ',
  'Task ไหน overdue บ้าง?',
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildSystemPrompt(tasks, requirements, projectName) {
  const today = new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })

  const taskLines = tasks
    .map(t => {
      const due = t.dueDate ? formatDate(t.dueDate) : 'ไม่กำหนด'
      const done = t.dateDone ? ` | เสร็จ: ${formatDate(t.dateDone)}` : ''
      return `  [${t.status}] ${t.title} | เจ้าของ: ${t.owner} | ระดับ: ${t.priority} | Due: ${due} | Module: ${t.module || '-'}${done}`
    })
    .join('\n')

  const reqLines = requirements.length
    ? requirements
        .map(r => `  [${r.status}] ${r.title} | ประเภท: ${r.type} | Priority: ${r.priority} | Effort: ${r.effort} | Impact: ${r.impact}`)
        .join('\n')
    : '  (ไม่มี requirements)'

  return `คุณคือผู้ช่วย AI สำหรับระบบจัดการโปรเจกต์ "Golf Task App"
วันนี้: ${today}
โปรเจกต์ที่ใช้งาน: ${projectName}

=== Tasks (${tasks.length} รายการ) ===
${taskLines || '  (ไม่มี tasks)'}

=== Requirements (${requirements.length} รายการ) ===
${reqLines}

กฎในการตอบ:
- ตอบเป็นภาษาไทยเสมอ
- กระชับ ชัดเจน ตรงประเด็น
- ถ้าอ้างถึง task ให้ระบุชื่อ task เสมอ
- จัดลำดับความสำคัญจาก deadline ใกล้ → priority สูง → status ที่ค้างอยู่`
}

async function callClaude({ apiKey, systemPrompt, messages, onChunk, signal }) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-client-side-origin-allowlist': window.location.origin,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      stream: true,
      system: systemPrompt,
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `HTTP ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data: ')) continue
      const payload = line.slice(6).trim()
      if (payload === '[DONE]' || payload === '') continue
      try {
        const parsed = JSON.parse(payload)
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          fullText += parsed.delta.text
          onChunk(fullText)
        }
      } catch { /* malformed SSE line — skip */ }
    }
  }

  return fullText
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      title="คัดลอก"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: 'var(--text-muted)', borderRadius: 4 }}
    >
      {copied ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
    </button>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isUser ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
        background: isUser ? 'var(--accent)' : 'var(--surface)',
        color: isUser ? '#fff' : 'var(--text-primary)',
        fontSize: 13,
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
        position: 'relative',
      }}>
        {msg.content}
        {!isUser && msg.content && (
          <span style={{ position: 'absolute', top: 4, right: 6 }}>
            <CopyButton text={msg.content} />
          </span>
        )}
        {msg.streaming && (
          <span style={{ display: 'inline-block', width: 6, height: 13, background: 'var(--accent)', borderRadius: 2, marginLeft: 3, animation: 'blink 1s step-end infinite' }} />
        )}
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
      <div style={{ padding: '10px 16px', borderRadius: '4px 16px 16px 16px', background: 'var(--surface)', display: 'flex', gap: 5, alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', display: 'inline-block', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────

function ChatTab({ systemPrompt, apiKey, chatHistory, onAddMessage, onClearHistory }) {
  const [messages, setMessages] = useState(
    chatHistory.length > 0
      ? chatHistory.map(({ role, content }) => ({ role, content }))
      : []
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = useCallback(async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: userText }
    const newMsgs = [...messages, userMsg]
    setMessages([...newMsgs, { role: 'assistant', content: '', streaming: true }])
    setLoading(true)

    abortRef.current = new AbortController()

    try {
      const fullText = await callClaude({
        apiKey,
        systemPrompt,
        messages: newMsgs,
        signal: abortRef.current.signal,
        onChunk: (partial) => {
          setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, content: partial } : m))
        },
      })
      const finalMsgs = [...newMsgs, { role: 'assistant', content: fullText }]
      setMessages(finalMsgs)
      onAddMessage('user', userText)
      onAddMessage('assistant', fullText)
    } catch (err) {
      if (err.name === 'AbortError') return
      setMessages(prev => prev.slice(0, -1))
      setError(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }, [input, messages, loading, apiKey, systemPrompt, onAddMessage])

  const clearAll = () => {
    setMessages([])
    onClearHistory()
    setError('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12 }}>
      {/* Quick prompts */}
      {messages.length === 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => send(p)}
              style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Message list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {loading && messages[messages.length - 1]?.streaming === false && <ThinkingDots />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', padding: '8px 12px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {/* Input bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        {messages.length > 0 && (
          <button onClick={clearAll} title="ล้างประวัติ" style={{ flexShrink: 0, padding: '8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'var(--text-muted)' }}>
            <Trash2 size={14} />
          </button>
        )}
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="พิมพ์คำถาม… (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
          rows={2}
          style={{ flex: 1, resize: 'none', padding: '10px 12px', borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 12, background: 'var(--accent)', border: 'none', cursor: 'pointer', color: '#fff', opacity: (!input.trim() || loading) ? 0.5 : 1 }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Daily Plan Tab ────────────────────────────────────────────────────────────

function DailyPlanTab({ systemPrompt, apiKey }) {
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setPlan(null)
    try {
      const prompt = `สร้าง Daily Plan สำหรับวันนี้ในรูปแบบ JSON เท่านั้น (ไม่ต้องมีข้อความอื่น):
{
  "date": "วันที่วันนี้",
  "summary": "สรุปวันนี้สั้นๆ",
  "slots": [
    { "time": "09:00–10:30", "task": "ชื่อ task", "priority": "High|Medium|Low", "note": "หมายเหตุ" }
  ],
  "tips": ["เคล็ดลับ 1", "เคล็ดลับ 2"]
}`

      let raw = ''
      await callClaude({
        apiKey,
        systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        signal: new AbortController().signal,
        onChunk: (t) => { raw = t },
      })
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI ไม่ได้ส่ง JSON กลับมา')
      setPlan(JSON.parse(jsonMatch[0]))
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const PRIORITY_COLOR = { High: 'var(--red)', Medium: 'var(--amber)', Low: 'var(--green)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI จะวางแผนวันนี้ให้โดยอิงจาก deadline และ priority ของ tasks ทั้งหมด</p>
        <button
          className="btn btn-primary"
          onClick={generate}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Calendar size={13} />}
          {loading ? 'กำลังสร้าง…' : 'สร้าง Plan'}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {plan && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '12px 16px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{plan.date}</p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{plan.summary}</p>
          </div>

          {plan.slots?.map((slot, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ flexShrink: 0, minWidth: 90, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', paddingTop: 2 }}>
                {slot.time}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{slot.task}</span>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `${PRIORITY_COLOR[slot.priority]}20`, color: PRIORITY_COLOR[slot.priority] }}>
                    {slot.priority}
                  </span>
                </div>
                {slot.note && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{slot.note}</p>}
              </div>
            </div>
          ))}

          {plan.tips?.length > 0 && (
            <div style={{ padding: '12px 16px', background: 'rgba(14,165,233,0.06)', borderRadius: 12, border: '1px solid rgba(14,165,233,0.2)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', marginBottom: 8 }}>💡 เคล็ดลับวันนี้</p>
              {plan.tips.map((tip, i) => (
                <p key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>• {tip}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Smart Suggest Tab ─────────────────────────────────────────────────────────

function SmartSuggestTab({ systemPrompt, apiKey }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const prompt = `วิเคราะห์ tasks และ requirements ทั้งหมด แล้วตอบเป็น JSON เท่านั้น:
{
  "topPriorities": [
    { "title": "ชื่อ task", "reason": "เหตุผล", "urgency": "critical|high|medium" }
  ],
  "atRisk": [
    { "title": "ชื่อ task", "risk": "เหตุผลความเสี่ยง" }
  ],
  "ownerLoad": [
    { "owner": "ชื่อ", "taskCount": 0, "overdueCount": 0, "suggestion": "คำแนะนำ" }
  ],
  "insight": "สรุปภาพรวมของโปรเจกต์"
}`

      let raw = ''
      await callClaude({
        apiKey,
        systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        signal: new AbortController().signal,
        onChunk: (t) => { raw = t },
      })
      const jsonMatch = raw.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('AI ไม่ได้ส่ง JSON กลับมา')
      setResult(JSON.parse(jsonMatch[0]))
    } catch (err) {
      setError(`เกิดข้อผิดพลาด: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const URGENCY_COLOR = { critical: 'var(--red)', high: 'var(--amber)', medium: 'var(--accent)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>AI วิเคราะห์ workload, ความเสี่ยง และจัดลำดับงานอัตโนมัติ</p>
        <button
          className="btn btn-primary"
          onClick={analyze}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={13} />}
          {loading ? 'กำลังวิเคราะห์…' : 'วิเคราะห์'}
        </button>
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--red)', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Insight */}
          {result.insight && (
            <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.08)', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)' }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 6 }}>🔍 ภาพรวม</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{result.insight}</p>
            </div>
          )}

          {/* Top priorities */}
          {result.topPriorities?.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>🎯 งานที่ต้องทำก่อน</p>
              {result.topPriorities.map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${URGENCY_COLOR[item.urgency]}20`, color: URGENCY_COLOR[item.urgency], flexShrink: 0, marginTop: 2, fontWeight: 600 }}>
                    {item.urgency?.toUpperCase()}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* At risk */}
          {result.atRisk?.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠️ งานที่มีความเสี่ยง</p>
              {result.atRisk.map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--red)' }}>{item.risk}</p>
                </div>
              ))}
            </div>
          )}

          {/* Owner load */}
          {result.ownerLoad?.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>👤 Workload ต่อคน</p>
              {result.ownerLoad.map((item, i) => (
                <div key={i} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.owner}</span>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>{item.taskCount} tasks</span>
                      {item.overdueCount > 0 && <span style={{ color: 'var(--red)' }}>{item.overdueCount} overdue</span>}
                    </div>
                  </div>
                  {item.suggestion && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.suggestion}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AIPage() {
  const {
    getProjectTasks,
    getProjectRequirements,
    projects,
    activeProjectId,
    aiChatHistory,
    addChatMessage,
    clearChatHistory,
  } = useStore()

  const [activeTab, setActiveTab] = useState('chat')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('claude_api_key') || '')
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem('claude_api_key'))

  const tasks = getProjectTasks()
  const requirements = getProjectRequirements()
  const project = projects.find(p => p.id === activeProjectId)
  const systemPrompt = buildSystemPrompt(tasks, requirements, project?.name || 'Unknown')

  const saveKey = (key) => {
    localStorage.setItem('claude_api_key', key)
    setApiKey(key)
    setShowKeyInput(false)
  }

  if (showKeyInput || !apiKey) {
    return <ApiKeySetup onSave={saveKey} />
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 className="section-title">AI Assistant</h2>
          <p className="section-sub">powered by {AI_MODEL} · {tasks.length} tasks · {requirements.length} requirements</p>
        </div>
        <button
          onClick={() => setShowKeyInput(true)}
          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          เปลี่ยน API Key
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 12, padding: 4, flexShrink: 0 }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: activeTab === id ? 600 : 400,
              background: activeTab === id ? 'var(--bg)' : 'transparent',
              color: activeTab === id ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: activeTab === id ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {activeTab === 'chat' && (
          <ChatTab
            systemPrompt={systemPrompt}
            apiKey={apiKey}
            chatHistory={aiChatHistory}
            onAddMessage={addChatMessage}
            onClearHistory={clearChatHistory}
          />
        )}
        {activeTab === 'plan' && (
          <DailyPlanTab systemPrompt={systemPrompt} apiKey={apiKey} />
        )}
        {activeTab === 'suggest' && (
          <SmartSuggestTab systemPrompt={systemPrompt} apiKey={apiKey} />
        )}
      </div>
    </div>
  )
}

// ── API Key Setup ─────────────────────────────────────────────────────────────

function ApiKeySetup({ onSave }) {
  const [key, setKey] = useState('')
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
      <Brain size={40} color="var(--accent)" />
      <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>ใส่ Anthropic API Key</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 360 }}>
        API Key จะถูกเก็บใน localStorage ของเบราว์เซอร์นี้เท่านั้น ไม่มีการส่งไปที่ server ใด
      </p>
      <input
        type="password"
        value={key}
        onChange={e => setKey(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())}
        placeholder="sk-ant-api03-..."
        style={{ width: 320, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }}
        autoFocus
      />
      <button
        className="btn btn-primary"
        disabled={!key.trim()}
        onClick={() => onSave(key.trim())}
      >
        บันทึกและเริ่มใช้งาน
      </button>
    </div>
  )
}
