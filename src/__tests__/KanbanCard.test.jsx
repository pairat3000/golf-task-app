import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { useStore } from '../store'

// Import the named export by extracting from the module via dynamic import
// KanbanCard is not exported directly — we test via KanbanPage
import KanbanPage from '../pages/KanbanPage'

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockTasks = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Fix login bug',
    owner: 'Golf',
    module: 'Frontend',
    status: 'Open',
    priority: 'High',
    dueDate: '2099-12-31',
    tags: ['bug', 'urgent'],
    subtasks: [
      { id: 'st1', title: 'Step 1', done: true },
      { id: 'st2', title: 'Step 2', done: false },
    ],
    comments: [{ id: 'c1', text: 'Noted', author: 'Golf', createdAt: new Date().toISOString() }],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Design new logo',
    owner: 'Alice',
    module: 'Design',
    status: 'In Progress',
    priority: 'Medium',
    dueDate: '',
    tags: [],
    subtasks: [],
    comments: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Write API docs',
    owner: 'Bob',
    module: 'Backend',
    status: 'Done',
    priority: 'Low',
    dueDate: '',
    tags: [],
    subtasks: [],
    comments: [],
    createdAt: new Date().toISOString(),
  },
]

beforeEach(() => {
  act(() => {
    useStore.setState({
      projects: [{ id: 'p1', name: 'Test Project', color: '#0ea5e9', createdAt: new Date().toISOString() }],
      tasks: mockTasks,
      requirements: [],
      notifications: [],
      activeProjectId: 'p1',
      darkMode: false,
    })
  })
})

// ── KanbanPage render tests ───────────────────────────────────────────────────

describe('KanbanPage', () => {
  it('renders the page title', () => {
    render(<KanbanPage />)
    expect(screen.getByText('Kanban Board')).toBeInTheDocument()
  })

  it('shows task count', () => {
    render(<KanbanPage />)
    expect(screen.getByText(/3 tasks total/)).toBeInTheDocument()
  })

  it('renders all status columns', () => {
    render(<KanbanPage />)
    const statuses = ['Open', 'To Do', 'In Progress', 'Review', 'Test', 'Done', 'Cancel']
    statuses.forEach(status => {
      const headings = screen.getAllByText(status)
      expect(headings.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders task titles', () => {
    render(<KanbanPage />)
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('Design new logo')).toBeInTheDocument()
    expect(screen.getByText('Write API docs')).toBeInTheDocument()
  })

  it('shows module tag for task with module', () => {
    render(<KanbanPage />)
    expect(screen.getByText('Frontend')).toBeInTheDocument()
  })

  it('shows subtask progress bar for task with subtasks', () => {
    render(<KanbanPage />)
    expect(screen.getByText('1/2 subtasks')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('shows comment count badge', () => {
    render(<KanbanPage />)
    expect(screen.getByText('💬 1')).toBeInTheDocument()
  })

  it('renders "New Task" button', () => {
    render(<KanbanPage />)
    expect(screen.getByText('New Task')).toBeInTheDocument()
  })
})

// ── Delete confirmation ───────────────────────────────────────────────────────

describe('KanbanPage delete', () => {
  it('calls deleteTask after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<KanbanPage />)

    const deleteButtons = document.querySelectorAll('.btn-ghost.btn-icon')
    // Each card has a delete button — click the first one
    fireEvent.click(deleteButtons[0])

    expect(window.confirm).toHaveBeenCalled()
    expect(useStore.getState().tasks.length).toBeLessThan(mockTasks.length)

    vi.restoreAllMocks()
  })

  it('does NOT delete when confirm returns false', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<KanbanPage />)

    const deleteButtons = document.querySelectorAll('.btn-ghost.btn-icon')
    fireEvent.click(deleteButtons[0])

    expect(useStore.getState().tasks).toHaveLength(mockTasks.length)

    vi.restoreAllMocks()
  })
})

// ── Tag rendering ─────────────────────────────────────────────────────────────

describe('KanbanCard tag chips', () => {
  it('renders up to 3 tags', () => {
    act(() => {
      useStore.setState({
        tasks: [{
          id: 't10', projectId: 'p1', title: 'Multi-tag task',
          owner: 'X', module: '', status: 'Open', priority: 'Low',
          dueDate: '', tags: ['bug', 'urgent', 'feature', 'docs'],
          subtasks: [], comments: [], createdAt: new Date().toISOString(),
        }]
      })
    })
    render(<KanbanPage />)
    expect(screen.getByText('#bug')).toBeInTheDocument()
    expect(screen.getByText('#urgent')).toBeInTheDocument()
    expect(screen.getByText('#feature')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument() // overflow indicator
  })
})
