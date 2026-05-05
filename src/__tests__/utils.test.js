import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatDate,
  formatDateTime,
  getDaysUntilDue,
  getDueDateColor,
  generateId,
  calcProductivity,
  getBadgeClass,
  groupBy,
  truncate,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  STATUSES,
  PRIORITIES,
} from '../lib/utils'

// ── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('returns em-dash for empty string', () => {
    expect(formatDate('')).toBe('—')
  })

  it('returns em-dash for null/undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('formats a valid ISO date string', () => {
    expect(formatDate('2025-01-15')).toMatch(/15 Jan 2025/)
  })

  it('returns em-dash for invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('returns em-dash for empty string', () => {
    expect(formatDateTime('')).toBe('—')
  })

  it('formats a valid ISO datetime string', () => {
    const result = formatDateTime('2025-01-15T09:30:00')
    expect(result).toMatch(/15 Jan 2025/)
    expect(result).toMatch(/09:30/)
  })
})

// ── getDaysUntilDue ───────────────────────────────────────────────────────────

describe('getDaysUntilDue', () => {
  it('returns null for empty string', () => {
    expect(getDaysUntilDue('')).toBeNull()
    expect(getDaysUntilDue(null)).toBeNull()
  })

  it('returns a number for a valid date', () => {
    const future = new Date()
    future.setDate(future.getDate() + 5)
    const result = getDaysUntilDue(future.toISOString().split('T')[0])
    expect(typeof result).toBe('number')
    expect(result).toBeGreaterThanOrEqual(4) // allow off-by-one from time zones
    expect(result).toBeLessThanOrEqual(6)
  })

  it('returns negative number for past date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 3)
    const result = getDaysUntilDue(past.toISOString().split('T')[0])
    expect(result).toBeLessThan(0)
  })
})

// ── getDueDateColor ───────────────────────────────────────────────────────────

describe('getDueDateColor', () => {
  it('returns muted color for null/empty', () => {
    expect(getDueDateColor('')).toBe('var(--text-muted)')
    expect(getDueDateColor(null)).toBe('var(--text-muted)')
  })

  it('returns red for overdue date', () => {
    const past = new Date()
    past.setDate(past.getDate() - 1)
    expect(getDueDateColor(past.toISOString().split('T')[0])).toBe('var(--red)')
  })

  it('returns red for due within 2 days', () => {
    const soon = new Date()
    soon.setDate(soon.getDate() + 1)
    expect(getDueDateColor(soon.toISOString().split('T')[0])).toBe('var(--red)')
  })

  it('returns amber for due in 3-5 days', () => {
    const near = new Date()
    near.setDate(near.getDate() + 4)
    expect(getDueDateColor(near.toISOString().split('T')[0])).toBe('var(--amber)')
  })

  it('returns muted for due far in the future', () => {
    const far = new Date()
    far.setDate(far.getDate() + 30)
    expect(getDueDateColor(far.toISOString().split('T')[0])).toBe('var(--text-muted)')
  })
})

// ── generateId ────────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique ids each call', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

// ── calcProductivity ──────────────────────────────────────────────────────────

describe('calcProductivity', () => {
  it('returns 0 for empty array', () => {
    expect(calcProductivity([])).toBe(0)
  })

  it('returns 0 when all tasks are Cancelled', () => {
    const tasks = [
      { status: 'Cancel' },
      { status: 'Cancel' },
    ]
    expect(calcProductivity(tasks)).toBe(0)
  })

  it('returns 100 when all non-cancelled tasks are Done', () => {
    const tasks = [
      { status: 'Done' },
      { status: 'Done' },
      { status: 'Cancel' },
    ]
    expect(calcProductivity(tasks)).toBe(100)
  })

  it('returns 50 when half are Done', () => {
    const tasks = [
      { status: 'Done' },
      { status: 'In Progress' },
    ]
    expect(calcProductivity(tasks)).toBe(50)
  })

  it('rounds to nearest integer', () => {
    const tasks = [
      { status: 'Done' },
      { status: 'Open' },
      { status: 'Open' },
    ]
    expect(calcProductivity(tasks)).toBe(33)
  })
})

// ── getBadgeClass ─────────────────────────────────────────────────────────────

describe('getBadgeClass', () => {
  it('returns correct class for known statuses', () => {
    expect(getBadgeClass('Open')).toBe('badge badge-open')
    expect(getBadgeClass('In Progress')).toBe('badge badge-inprogress')
    expect(getBadgeClass('Done')).toBe('badge badge-done')
    expect(getBadgeClass('Cancel')).toBe('badge badge-cancel')
  })

  it('falls back to badge-open for unknown status', () => {
    expect(getBadgeClass('Unknown')).toBe('badge badge-open')
  })
})

// ── groupBy ───────────────────────────────────────────────────────────────────

describe('groupBy', () => {
  const items = [
    { type: 'a', val: 1 },
    { type: 'b', val: 2 },
    { type: 'a', val: 3 },
  ]

  it('groups by string key', () => {
    const result = groupBy(items, 'type')
    expect(result.a).toHaveLength(2)
    expect(result.b).toHaveLength(1)
  })

  it('groups by function', () => {
    const result = groupBy(items, item => item.val > 1 ? 'big' : 'small')
    expect(result.small).toHaveLength(1)
    expect(result.big).toHaveLength(2)
  })
})

// ── truncate ──────────────────────────────────────────────────────────────────

describe('truncate', () => {
  it('returns empty string for null/undefined', () => {
    expect(truncate(null)).toBe('')
    expect(truncate(undefined)).toBe('')
  })

  it('returns string unchanged when shorter than max', () => {
    expect(truncate('hello', 10)).toBe('hello')
  })

  it('truncates and appends ellipsis when longer than max', () => {
    const result = truncate('hello world', 5)
    expect(result).toBe('hello…')
    expect(result.length).toBe(6)
  })
})

// ── Config exports ────────────────────────────────────────────────────────────

describe('STATUS_CONFIG', () => {
  it('has all 7 statuses', () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(7)
  })

  it('each status has color, bg, and label', () => {
    for (const cfg of Object.values(STATUS_CONFIG)) {
      expect(cfg).toHaveProperty('color')
      expect(cfg).toHaveProperty('bg')
      expect(cfg).toHaveProperty('label')
    }
  })
})

describe('STATUSES array', () => {
  it('matches STATUS_CONFIG keys', () => {
    expect(STATUSES).toEqual(Object.keys(STATUS_CONFIG))
  })
})

describe('PRIORITIES array', () => {
  it('matches PRIORITY_CONFIG keys', () => {
    expect(PRIORITIES).toEqual(Object.keys(PRIORITY_CONFIG))
  })
})
