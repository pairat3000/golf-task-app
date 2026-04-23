import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STATUSES = ['Open', 'To Do', 'In Progress', 'Review', 'Test', 'Done', 'Cancel']

const sampleTasks = [
  { id: 't1', projectId: 'p1', title: 'Setup authentication flow', owner: 'Golf', module: 'Backend', status: 'Done', priority: 'High', startDate: '2025-01-10', dueDate: '2025-01-15', description: 'Implement JWT auth', createdAt: new Date().toISOString() },
  { id: 't2', projectId: 'p1', title: 'Design dashboard UI', owner: 'Golf', module: 'Frontend', status: 'In Progress', priority: 'High', startDate: '2025-01-12', dueDate: '2025-01-20', description: 'Create main dashboard', createdAt: new Date().toISOString() },
  { id: 't3', projectId: 'p1', title: 'API integration testing', owner: 'Golf', module: 'QA', status: 'Review', priority: 'Medium', startDate: '2025-01-14', dueDate: '2025-01-22', description: 'Test all endpoints', createdAt: new Date().toISOString() },
  { id: 't4', projectId: 'p1', title: 'Mobile responsive layout', owner: 'Golf', module: 'Frontend', status: 'To Do', priority: 'Medium', startDate: '2025-01-18', dueDate: '2025-01-25', description: 'Make app mobile friendly', createdAt: new Date().toISOString() },
  { id: 't5', projectId: 'p1', title: 'Database schema optimization', owner: 'Golf', module: 'Backend', status: 'Open', priority: 'Low', startDate: '2025-01-20', dueDate: '2025-01-30', description: 'Optimize queries', createdAt: new Date().toISOString() },
  { id: 't6', projectId: 'p2', title: 'Market research analysis', owner: 'Golf', module: 'Research', status: 'Done', priority: 'High', startDate: '2025-01-05', dueDate: '2025-01-12', description: 'Analyze competitors', createdAt: new Date().toISOString() },
  { id: 't7', projectId: 'p2', title: 'Content strategy planning', owner: 'Golf', module: 'Marketing', status: 'In Progress', priority: 'High', startDate: '2025-01-13', dueDate: '2025-01-21', description: 'Plan content calendar', createdAt: new Date().toISOString() },
]

const sampleProjects = [
  { id: 'p1', name: 'Golf Task App', description: 'Personal PM system', color: '#0ea5e9', createdAt: new Date().toISOString() },
  { id: 'p2', name: 'Marketing Campaign', description: 'Q1 campaign planning', color: '#8b5cf6', createdAt: new Date().toISOString() },
]

const sampleNotifications = [
  { id: 'n1', taskId: 't2', title: 'Design dashboard UI', message: 'Due in 2 days', type: 'warning', read: false, createdAt: new Date().toISOString() },
  { id: 'n2', taskId: 't3', title: 'API integration testing', message: 'Due tomorrow', type: 'danger', read: false, createdAt: new Date().toISOString() },
]

// REQ_STATUS: Inbox → Reviewing → Approved → Rejected → Converted
const sampleRequirements = [
  { id: 'r1', projectId: 'p1', title: 'Dark mode support', description: 'Allow users to toggle between light and dark themes for better readability at night.', type: 'Feature', priority: 'High', status: 'Approved', requestedBy: 'Golf', module: 'Frontend', effort: 'Medium', impact: 'High', notes: 'Users have requested this many times', convertedTaskId: null, createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: 'r2', projectId: 'p1', title: 'Export to PDF', description: 'Add ability to export task reports as PDF files for sharing with stakeholders.', type: 'Feature', priority: 'Medium', status: 'Reviewing', requestedBy: 'Golf', module: 'Backend', effort: 'High', impact: 'Medium', notes: '', convertedTaskId: null, createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'r3', projectId: 'p1', title: 'Real-time collaboration', description: 'Multiple users editing the same board simultaneously with live cursor tracking.', type: 'Enhancement', priority: 'Low', status: 'Rejected', requestedBy: 'Golf', module: 'Backend', effort: 'Very High', impact: 'High', notes: 'Too complex for current scope. Revisit in v2.', convertedTaskId: null, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: 'r4', projectId: 'p1', title: 'Mobile push notifications', description: 'Send push notifications to mobile devices when tasks are due or assigned.', type: 'Feature', priority: 'High', status: 'Inbox', requestedBy: 'Golf', module: 'DevOps', effort: 'Medium', impact: 'High', notes: '', convertedTaskId: null, createdAt: new Date().toISOString() },
]

export const useStore = create(
  persist(
    (set, get) => ({
      // State
      projects: sampleProjects,
      tasks: sampleTasks,
      requirements: sampleRequirements,
      notifications: sampleNotifications,
      activeProjectId: 'p1',
      darkMode: true,
      aiPlan: null,
      aiLoading: false,

      // Project actions
      setActiveProject: (id) => set({ activeProjectId: id }),
      addProject: (project) => set(s => ({ projects: [...s.projects, { ...project, id: 'p' + Date.now(), createdAt: new Date().toISOString() }] })),
      updateProject: (id, data) => set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p) })),
      deleteProject: (id) => set(s => ({ projects: s.projects.filter(p => p.id !== id), tasks: s.tasks.filter(t => t.projectId !== id) })),

      // Task actions
      addTask: (task) => {
        const newTask = {
          id: 't' + Date.now(),
          projectId: get().activeProjectId,
          status: 'Open',
          priority: 'Medium',
          owner: 'Golf',
          module: '',
          startDate: '',
          dueDate: '',
          description: '',
          createdAt: new Date().toISOString(),
          ...task
        }
        set(s => ({ tasks: [...s.tasks, newTask] }))
        get().checkDeadlineNotifications()
        return newTask
      },
      updateTask: (id, data) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== id) return t
            const updated = { ...t, ...data }
            if (data.status === 'Done' && t.status !== 'Done' && !updated.dateDone) {
              updated.dateDone = new Date().toISOString()
            } else if (data.status && data.status !== 'Done' && t.status === 'Done') {
              updated.dateDone = ''
            }
            return updated
          })
        }))
        get().checkDeadlineNotifications()
      },
      deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id !== id) })),
      moveTask: (taskId, newStatus) => {
        set(s => ({
          tasks: s.tasks.map(t => {
            if (t.id !== taskId) return t
            const updated = { ...t, status: newStatus }
            if (newStatus === 'Done' && t.status !== 'Done' && !t.dateDone) {
              updated.dateDone = new Date().toISOString()
            } else if (newStatus !== 'Done' && t.status === 'Done') {
              updated.dateDone = ''
            }
            return updated
          })
        }))
      },

      // Requirement actions
      addRequirement: (req) => {
        const newReq = {
          id: 'r' + Date.now(),
          projectId: get().activeProjectId,
          title: '',
          description: '',
          type: 'Feature',
          priority: 'Medium',
          status: 'Inbox',
          requestedBy: 'Golf',
          module: '',
          effort: 'Medium',
          impact: 'Medium',
          notes: '',
          convertedTaskId: null,
          createdAt: new Date().toISOString(),
          ...req
        }
        set(s => ({ requirements: [...s.requirements, newReq] }))
        return newReq
      },
      updateRequirement: (id, data) => set(s => ({
        requirements: s.requirements.map(r => r.id === id ? { ...r, ...data } : r)
      })),
      deleteRequirement: (id) => set(s => ({
        requirements: s.requirements.filter(r => r.id !== id)
      })),
      convertRequirementToTask: (reqId) => {
        const req = get().requirements.find(r => r.id === reqId)
        if (!req) return null
        const newTask = get().addTask({
          projectId: req.projectId,
          title: req.title,
          description: req.description,
          module: req.module,
          priority: req.priority,
          owner: req.requestedBy,
          status: 'Open',
        })
        get().updateRequirement(reqId, { status: 'Converted', convertedTaskId: newTask.id })
        return newTask
      },
      getProjectRequirements: () => {
        const { requirements, activeProjectId } = get()
        return (requirements || []).filter(r => r.projectId === activeProjectId)
      },

      // Comments
      addComment: (taskId, text, author = 'Golf') => {
        const comment = { id: 'c' + Date.now(), text, author, createdAt: new Date().toISOString() }
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, comments: [...(t.comments || []), comment] }
            : t)
        }))
      },
      deleteComment: (taskId, commentId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) }
            : t)
        }))
      },

      // Tags
      addTag: (taskId, tag) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, tags: [...new Set([...(t.tags || []), tag.trim()])] }
            : t)
        }))
      },
      removeTag: (taskId, tag) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, tags: (t.tags || []).filter(tg => tg !== tag) }
            : t)
        }))
      },

      // Subtasks
      addSubtask: (taskId, title) => {
        const subtask = { id: 'st' + Date.now(), title, done: false, createdAt: new Date().toISOString() }
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
            : t)
        }))
      },
      toggleSubtask: (taskId, subtaskId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, done: !st.done } : st) }
            : t)
        }))
      },
      deleteSubtask: (taskId, subtaskId) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId) }
            : t)
        }))
      },
      updateSubtask: (taskId, subtaskId, title) => {
        set(s => ({
          tasks: s.tasks.map(t => t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, title } : st) }
            : t)
        }))
      },

      // Comments
      addComment: (taskId, text, author = 'Golf') => {
        const comment = { id: 'c' + Date.now(), text, author, createdAt: new Date().toISOString() }
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []), comment] } : t) }))
      },
      deleteComment: (taskId, commentId) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) } : t) }))
      },

      // Subtasks
      addSubtask: (taskId, title) => {
        const subtask = { id: 'st' + Date.now(), title, done: false, createdAt: new Date().toISOString() }
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), subtask] } : t) }))
      },
      toggleSubtask: (taskId, subtaskId) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, done: !st.done } : st) } : t) }))
      },
      deleteSubtask: (taskId, subtaskId) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter(st => st.id !== subtaskId) } : t) }))
      },
      updateSubtask: (taskId, subtaskId, title) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, subtasks: (t.subtasks || []).map(st => st.id === subtaskId ? { ...st, title } : st) } : t) }))
      },

      // Tags
      addTag: (taskId, tag) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, tags: [...new Set([...(t.tags || []), tag.trim()])] } : t) }))
      },
      removeTag: (taskId, tag) => {
        set(s => ({ tasks: s.tasks.map(t => t.id === taskId ? { ...t, tags: (t.tags || []).filter(tg => tg !== tag) } : t) }))
      },

      // Notifications
      checkDeadlineNotifications: () => {
        const { tasks } = get()
        const today = new Date()
        const newNotifs = []
        tasks.forEach(task => {
          if (!task.dueDate || task.status === 'Done' || task.status === 'Cancel') return
          const due = new Date(task.dueDate)
          const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))
          if (diff <= 3 && diff >= 0) {
            const existing = get().notifications.find(n => n.taskId === task.id)
            if (!existing) {
              newNotifs.push({
                id: 'n' + Date.now() + Math.random(),
                taskId: task.id,
                title: task.title,
                message: diff === 0 ? 'Due today!' : `Due in ${diff} day${diff > 1 ? 's' : ''}`,
                type: diff <= 1 ? 'danger' : 'warning',
                read: false,
                createdAt: new Date().toISOString()
              })
            }
          }
        })
        if (newNotifs.length > 0) {
          set(s => ({ notifications: [...newNotifs, ...s.notifications] }))
        }
      },
      markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllRead: () => set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      clearNotification: (id) => set(s => ({ notifications: s.notifications.filter(n => n.id !== id) })),

      // AI
      setAiPlan: (plan) => set({ aiPlan: plan }),
      setAiLoading: (v) => set({ aiLoading: v }),

      // Settings
      toggleDarkMode: () => set(s => ({ darkMode: !s.darkMode })),

      // Backup/Restore
      exportData: () => {
        const { projects, tasks } = get()
        const data = { projects, tasks, exportedAt: new Date().toISOString(), version: '1.0' }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `golf-task-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      },
      importData: (data) => {
        if (data.projects && data.tasks) {
          set({ projects: data.projects, tasks: data.tasks })
          return true
        }
        return false
      },

      // Computed helpers
      getProjectTasks: () => {
        const { tasks, activeProjectId } = get()
        return tasks.filter(t => t.projectId === activeProjectId)
      },
      getTasksByStatus: (status) => {
        const { tasks, activeProjectId } = get()
        return tasks.filter(t => t.projectId === activeProjectId && t.status === status)
      },
      getUnreadCount: () => get().notifications.filter(n => !n.read).length,
    }),
    {
      name: 'golf-task-storage',
      partialize: (state) => ({
        projects: state.projects,
        tasks: state.tasks,
        requirements: state.requirements,
        notifications: state.notifications,
        darkMode: state.darkMode,
        activeProjectId: state.activeProjectId,
      })
    }
  )
)

export { STATUSES }
