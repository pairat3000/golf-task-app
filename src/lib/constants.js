// Shared constants — import from here instead of inline-defining in components

export const TAG_COLORS = {
  bug:      '#ef4444',
  feature:  '#0ea5e9',
  urgent:   '#f59e0b',
  blocked:  '#dc2626',
  review:   '#8b5cf6',
  design:   '#ec4899',
  api:      '#06b6d4',
  mobile:   '#10b981',
  docs:     '#84cc16',
}

export const PRESET_TAGS = Object.keys(TAG_COLORS)

export const MODULE_OPTIONS = [
  'Frontend',
  'Backend',
  'QA',
  'Design',
  'DevOps',
  'Research',
  'Marketing',
  'Other',
]

export const REQ_TYPES = ['Feature', 'Enhancement', 'Bug Fix', 'Research', 'Other']
export const REQ_EFFORTS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
export const REQ_IMPACTS = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
export const REQ_PRIORITIES = ['Critical', 'High', 'Medium', 'Low']

export const EFFORT_SCORE = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 }
export const IMPACT_SCORE = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 }
export const PRIORITY_SCORE = { Critical: 4, High: 3, Medium: 2, Low: 1 }

export function calcReqScore(req) {
  const impact = IMPACT_SCORE[req.impact] ?? 3
  const effort = EFFORT_SCORE[req.effort] ?? 3
  const priority = PRIORITY_SCORE[req.priority] ?? 2
  return Math.round(((impact * 2 + priority) / (effort + 1)) * 10)
}

export const AI_MODEL = 'claude-sonnet-4-5'
export const AI_MAX_TOKENS = 2048
