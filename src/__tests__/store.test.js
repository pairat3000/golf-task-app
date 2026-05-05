import { describe, it, expect, beforeEach } from 'vitest'
import { act } from 'react'
import { useStore } from '../store'

// Reset store to fresh state before each test
beforeEach(() => {
  act(() => {
    useStore.setState({
      projects: [
        { id: 'p1', name: 'Test Project', description: '', color: '#0ea5e9', createdAt: new Date().toISOString() },
      ],
      tasks: [],
      requirements: [],
      notifications: [],
      activeProjectId: 'p1',
      darkMode: false,
      aiPlan: null,
      aiLoading: false,
      aiChatHistory: [],
    })
  })
})

// ── Task actions ──────────────────────────────────────────────────────────────

describe('addTask', () => {
  it('adds a task with default fields', () => {
    act(() => { useStore.getState().addTask({ title: 'Test Task' }) })
    const tasks = useStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Test Task')
    expect(tasks[0].status).toBe('Open')
    expect(tasks[0].priority).toBe('Medium')
    expect(tasks[0].projectId).toBe('p1')
  })

  it('allows overriding defaults', () => {
    act(() => { useStore.getState().addTask({ title: 'Urgent', status: 'In Progress', priority: 'High', owner: 'Alice' }) })
    const task = useStore.getState().tasks[0]
    expect(task.status).toBe('In Progress')
    expect(task.priority).toBe('High')
    expect(task.owner).toBe('Alice')
  })

  it('returns the new task', () => {
    let result
    act(() => { result = useStore.getState().addTask({ title: 'Returned Task' }) })
    expect(result).toBeTruthy()
    expect(result.title).toBe('Returned Task')
    expect(result.id).toBeTruthy()
  })

  it('generates a unique id for each task', () => {
    act(() => {
      useStore.getState().addTask({ title: 'A' })
      useStore.getState().addTask({ title: 'B' })
    })
    const tasks = useStore.getState().tasks
    expect(tasks[0].id).not.toBe(tasks[1].id)
  })
})

describe('updateTask', () => {
  it('updates task fields', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'Original' }).id })
    act(() => { useStore.getState().updateTask(id, { title: 'Updated', priority: 'High' }) })
    const task = useStore.getState().tasks.find(t => t.id === id)
    expect(task.title).toBe('Updated')
    expect(task.priority).toBe('High')
  })

  it('sets dateDone when status changes to Done', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'Task' }).id })
    act(() => { useStore.getState().updateTask(id, { status: 'Done' }) })
    const task = useStore.getState().tasks.find(t => t.id === id)
    expect(task.dateDone).toBeTruthy()
  })

  it('clears dateDone when status changes away from Done', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'Task', status: 'Done', dateDone: new Date().toISOString() }).id })
    act(() => { useStore.getState().updateTask(id, { status: 'In Progress' }) })
    const task = useStore.getState().tasks.find(t => t.id === id)
    expect(task.dateDone).toBe('')
  })

  it('does not affect other tasks', () => {
    let id1, id2
    act(() => {
      id1 = useStore.getState().addTask({ title: 'Task 1' }).id
      id2 = useStore.getState().addTask({ title: 'Task 2' }).id
    })
    act(() => { useStore.getState().updateTask(id1, { title: 'Modified 1' }) })
    const task2 = useStore.getState().tasks.find(t => t.id === id2)
    expect(task2.title).toBe('Task 2')
  })
})

describe('deleteTask', () => {
  it('removes the task', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'To Delete' }).id })
    act(() => { useStore.getState().deleteTask(id) })
    expect(useStore.getState().tasks.find(t => t.id === id)).toBeUndefined()
  })

  it('only removes the targeted task', () => {
    let id1, id2
    act(() => {
      id1 = useStore.getState().addTask({ title: 'Keep' }).id
      id2 = useStore.getState().addTask({ title: 'Delete' }).id
    })
    act(() => { useStore.getState().deleteTask(id2) })
    expect(useStore.getState().tasks).toHaveLength(1)
    expect(useStore.getState().tasks[0].id).toBe(id1)
  })
})

describe('moveTask', () => {
  it('changes task status', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'Task' }).id })
    act(() => { useStore.getState().moveTask(id, 'In Progress') })
    expect(useStore.getState().tasks.find(t => t.id === id).status).toBe('In Progress')
  })

  it('sets dateDone when moved to Done', () => {
    let id
    act(() => { id = useStore.getState().addTask({ title: 'Task' }).id })
    act(() => { useStore.getState().moveTask(id, 'Done') })
    const task = useStore.getState().tasks.find(t => t.id === id)
    expect(task.dateDone).toBeTruthy()
  })

  it('clears dateDone when moved away from Done', () => {
    let id
    act(() => {
      id = useStore.getState().addTask({ title: 'Task', status: 'Done', dateDone: new Date().toISOString() }).id
    })
    act(() => { useStore.getState().moveTask(id, 'Review') })
    const task = useStore.getState().tasks.find(t => t.id === id)
    expect(task.dateDone).toBe('')
  })
})

// ── Subtask actions ───────────────────────────────────────────────────────────

describe('subtask actions', () => {
  let taskId
  beforeEach(() => {
    act(() => { taskId = useStore.getState().addTask({ title: 'Parent' }).id })
  })

  it('addSubtask appends a subtask', () => {
    act(() => { useStore.getState().addSubtask(taskId, 'Sub 1') })
    const task = useStore.getState().tasks.find(t => t.id === taskId)
    expect(task.subtasks).toHaveLength(1)
    expect(task.subtasks[0].title).toBe('Sub 1')
    expect(task.subtasks[0].done).toBe(false)
  })

  it('toggleSubtask flips done state', () => {
    act(() => { useStore.getState().addSubtask(taskId, 'Sub') })
    const stId = useStore.getState().tasks.find(t => t.id === taskId).subtasks[0].id
    act(() => { useStore.getState().toggleSubtask(taskId, stId) })
    expect(useStore.getState().tasks.find(t => t.id === taskId).subtasks[0].done).toBe(true)
    act(() => { useStore.getState().toggleSubtask(taskId, stId) })
    expect(useStore.getState().tasks.find(t => t.id === taskId).subtasks[0].done).toBe(false)
  })

  it('deleteSubtask removes the subtask', () => {
    act(() => {
      useStore.getState().addSubtask(taskId, 'Keep')
      useStore.getState().addSubtask(taskId, 'Remove')
    })
    const stId = useStore.getState().tasks.find(t => t.id === taskId).subtasks[1].id
    act(() => { useStore.getState().deleteSubtask(taskId, stId) })
    const subtasks = useStore.getState().tasks.find(t => t.id === taskId).subtasks
    expect(subtasks).toHaveLength(1)
    expect(subtasks[0].title).toBe('Keep')
  })

  it('updateSubtask changes the title', () => {
    act(() => { useStore.getState().addSubtask(taskId, 'Old title') })
    const stId = useStore.getState().tasks.find(t => t.id === taskId).subtasks[0].id
    act(() => { useStore.getState().updateSubtask(taskId, stId, 'New title') })
    expect(useStore.getState().tasks.find(t => t.id === taskId).subtasks[0].title).toBe('New title')
  })
})

// ── Tag actions ───────────────────────────────────────────────────────────────

describe('tag actions', () => {
  let taskId
  beforeEach(() => {
    act(() => { taskId = useStore.getState().addTask({ title: 'Task' }).id })
  })

  it('addTag adds a tag', () => {
    act(() => { useStore.getState().addTag(taskId, 'bug') })
    expect(useStore.getState().tasks.find(t => t.id === taskId).tags).toContain('bug')
  })

  it('addTag deduplicates tags', () => {
    act(() => {
      useStore.getState().addTag(taskId, 'bug')
      useStore.getState().addTag(taskId, 'bug')
    })
    expect(useStore.getState().tasks.find(t => t.id === taskId).tags).toHaveLength(1)
  })

  it('addTag trims whitespace', () => {
    act(() => { useStore.getState().addTag(taskId, '  feature  ') })
    expect(useStore.getState().tasks.find(t => t.id === taskId).tags).toContain('feature')
  })

  it('removeTag removes a tag', () => {
    act(() => {
      useStore.getState().addTag(taskId, 'bug')
      useStore.getState().addTag(taskId, 'urgent')
      useStore.getState().removeTag(taskId, 'bug')
    })
    const tags = useStore.getState().tasks.find(t => t.id === taskId).tags
    expect(tags).not.toContain('bug')
    expect(tags).toContain('urgent')
  })
})

// ── Comment actions ───────────────────────────────────────────────────────────

describe('comment actions', () => {
  let taskId
  beforeEach(() => {
    act(() => { taskId = useStore.getState().addTask({ title: 'Task' }).id })
  })

  it('addComment adds a comment with author', () => {
    act(() => { useStore.getState().addComment(taskId, 'Hello', 'Alice') })
    const comments = useStore.getState().tasks.find(t => t.id === taskId).comments
    expect(comments).toHaveLength(1)
    expect(comments[0].text).toBe('Hello')
    expect(comments[0].author).toBe('Alice')
  })

  it('addComment defaults author to Golf', () => {
    act(() => { useStore.getState().addComment(taskId, 'Default') })
    const comment = useStore.getState().tasks.find(t => t.id === taskId).comments[0]
    expect(comment.author).toBe('Golf')
  })

  it('deleteComment removes the comment', () => {
    act(() => { useStore.getState().addComment(taskId, 'To remove') })
    const cId = useStore.getState().tasks.find(t => t.id === taskId).comments[0].id
    act(() => { useStore.getState().deleteComment(taskId, cId) })
    expect(useStore.getState().tasks.find(t => t.id === taskId).comments).toHaveLength(0)
  })
})

// ── Project actions ───────────────────────────────────────────────────────────

describe('project actions', () => {
  it('addProject creates a new project', () => {
    act(() => { useStore.getState().addProject({ name: 'New Project', color: '#ff0000' }) })
    const projects = useStore.getState().projects
    expect(projects).toHaveLength(2)
    expect(projects[1].name).toBe('New Project')
    expect(projects[1].id).toBeTruthy()
  })

  it('updateProject modifies project fields', () => {
    const id = useStore.getState().projects[0].id
    act(() => { useStore.getState().updateProject(id, { name: 'Renamed' }) })
    expect(useStore.getState().projects[0].name).toBe('Renamed')
  })

  it('deleteProject removes project and its tasks', () => {
    act(() => { useStore.getState().addTask({ title: 'Project Task', projectId: 'p1' }) })
    act(() => { useStore.getState().deleteProject('p1') })
    expect(useStore.getState().projects).toHaveLength(0)
    expect(useStore.getState().tasks).toHaveLength(0)
  })
})

// ── AI chat history ───────────────────────────────────────────────────────────

describe('AI chat history', () => {
  it('addChatMessage stores messages', () => {
    act(() => {
      useStore.getState().addChatMessage('user', 'Hello AI')
      useStore.getState().addChatMessage('assistant', 'Hello human')
    })
    const history = useStore.getState().aiChatHistory
    expect(history).toHaveLength(2)
    expect(history[0].role).toBe('user')
    expect(history[0].content).toBe('Hello AI')
    expect(history[1].role).toBe('assistant')
  })

  it('clearChatHistory empties the history', () => {
    act(() => {
      useStore.getState().addChatMessage('user', 'msg')
      useStore.getState().clearChatHistory()
    })
    expect(useStore.getState().aiChatHistory).toHaveLength(0)
  })
})

// ── Computed helpers ──────────────────────────────────────────────────────────

describe('getProjectTasks', () => {
  it('returns only tasks for the active project', () => {
    act(() => {
      useStore.getState().addTask({ title: 'P1 Task', projectId: 'p1' })
      useStore.getState().addTask({ title: 'P2 Task', projectId: 'p2' })
    })
    const tasks = useStore.getState().getProjectTasks()
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('P1 Task')
  })
})

describe('getTasksByStatus', () => {
  it('filters tasks by status for active project', () => {
    act(() => {
      useStore.getState().addTask({ title: 'Open 1', status: 'Open' })
      useStore.getState().addTask({ title: 'Done 1', status: 'Done' })
      useStore.getState().addTask({ title: 'Open 2', status: 'Open' })
    })
    const openTasks = useStore.getState().getTasksByStatus('Open')
    expect(openTasks).toHaveLength(2)
    expect(openTasks.every(t => t.status === 'Open')).toBe(true)
  })
})

// ── Notifications ─────────────────────────────────────────────────────────────

describe('notification actions', () => {
  it('markNotificationRead marks a notification as read', () => {
    act(() => {
      useStore.setState({
        notifications: [{ id: 'n1', read: false, taskId: 't1', title: 'Test', message: 'msg', type: 'warning', createdAt: new Date().toISOString() }]
      })
    })
    act(() => { useStore.getState().markNotificationRead('n1') })
    expect(useStore.getState().notifications[0].read).toBe(true)
  })

  it('markAllRead marks every notification as read', () => {
    act(() => {
      useStore.setState({
        notifications: [
          { id: 'n1', read: false },
          { id: 'n2', read: false },
        ]
      })
    })
    act(() => { useStore.getState().markAllRead() })
    expect(useStore.getState().notifications.every(n => n.read)).toBe(true)
  })

  it('clearNotification removes a notification', () => {
    act(() => {
      useStore.setState({ notifications: [{ id: 'n1' }, { id: 'n2' }] })
    })
    act(() => { useStore.getState().clearNotification('n1') })
    expect(useStore.getState().notifications).toHaveLength(1)
    expect(useStore.getState().notifications[0].id).toBe('n2')
  })

  it('getUnreadCount returns unread count', () => {
    act(() => {
      useStore.setState({
        notifications: [
          { id: 'n1', read: false },
          { id: 'n2', read: true },
          { id: 'n3', read: false },
        ]
      })
    })
    expect(useStore.getState().getUnreadCount()).toBe(2)
  })
})
