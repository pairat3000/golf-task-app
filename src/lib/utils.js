import { format, differenceInDays, parseISO, isValid } from 'date-fns'
export { TAG_COLORS, PRESET_TAGS, MODULE_OPTIONS } from './constants'

export const STATUS_CONFIG = {
  'Open':        { color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  label: 'Open' },
  'To Do':       { color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  label: 'To Do' },
  'In Progress': { color: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', label: 'In Progress' },
  'Review':      { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Review' },
  'Test':        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Test' },
  'Done':        { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Done' },
  'Cancel':      { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Cancel' },
}

export const PRIORITY_CONFIG = {
  'Critical': { color: '#dc2626', label: 'Critical' },
  'High':     { color: '#ef4444', label: 'High' },
  'Medium':   { color: '#f59e0b', label: 'Medium' },
  'Low':      { color: '#6b7280', label: 'Low' },
}

export const STATUSES   = Object.keys(STATUS_CONFIG)
export const PRIORITIES = Object.keys(PRIORITY_CONFIG)

export function getBadgeClass(status) {
  const map = {
    'Open':        'badge-open',
    'To Do':       'badge-todo',
    'In Progress': 'badge-inprogress',
    'Review':      'badge-review',
    'Test':        'badge-test',
    'Done':        'badge-done',
    'Cancel':      'badge-cancel',
  }
  return 'badge ' + (map[status] || 'badge-open')
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy') : '—'
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = parseISO(dateStr)
    return isValid(d) ? format(d, 'dd MMM yyyy HH:mm') : '—'
  } catch {
    return '—'
  }
}

export function getDaysUntilDue(dueDate) {
  if (!dueDate) return null
  try {
    return differenceInDays(parseISO(dueDate), new Date())
  } catch {
    return null
  }
}

export function getDueDateColor(dueDate) {
  const days = getDaysUntilDue(dueDate)
  if (days === null) return 'var(--text-muted)'
  if (days < 0)  return 'var(--red)'
  if (days <= 2) return 'var(--red)'
  if (days <= 5) return 'var(--amber)'
  return 'var(--text-muted)'
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export function calcProductivity(tasks) {
  const active = tasks.filter(t => t.status !== 'Cancel')
  if (!active.length) return 0
  const done = active.filter(t => t.status === 'Done').length
  return Math.round((done / active.length) * 100)
}

export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    ;(acc[k] = acc[k] || []).push(item)
    return acc
  }, {})
}

export function truncate(str, max = 60) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}
