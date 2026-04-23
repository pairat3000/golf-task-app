import { useState } from 'react'
import { LayoutDashboard, Kanban, List, Calendar, Sparkles, Settings, Bell, Plus, Menu, X, FolderOpen, ClipboardList } from 'lucide-react'
import { useStore } from './store'
import KanbanPage from './pages/KanbanPage'
import TaskListPage from './pages/TaskListPage'
import DashboardPage from './pages/DashboardPage'
import TimelinePage from './pages/TimelinePage'
import AIPage from './pages/AIPage'
import SettingsPage from './pages/SettingsPage'
import RequirementsPage from './pages/RequirementsPage'
import NotificationPanel from './components/NotificationPanel'
import TaskModal from './components/TaskModal'
import './index.css'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'kanban', label: 'Kanban Board', icon: Kanban },
  { id: 'tasks', label: 'Task List', icon: List },
  { id: 'timeline', label: 'Timeline', icon: Calendar },
  { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  { id: 'requirements', label: 'Requirements', icon: ClipboardList },
]

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  kanban: 'Kanban Board',
  tasks: 'Task List',
  timeline: 'Timeline',
  ai: 'AI Assistant',
  settings: 'Settings',
  requirements: 'Requirements',
}

export default function App() {
  const { projects, activeProjectId, setActiveProject, getUnreadCount, darkMode } = useStore()
  const [page, setPage] = useState('dashboard')
  const [showNotif, setShowNotif] = useState(false)
  const [quickTask, setQuickTask] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const unread = getUnreadCount()
  const activeProject = projects.find(p => p.id === activeProjectId)

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />
      case 'kanban': return <KanbanPage />
      case 'tasks': return <TaskListPage />
      case 'timeline': return <TimelinePage />
      case 'ai': return <AIPage />
      case 'settings': return <SettingsPage />
      case 'requirements': return <RequirementsPage />
      default: return <DashboardPage />
    }
  }

  const navigate = (p) => { setPage(p); setSidebarOpen(false) }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }} onClick={() => setSidebarOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">GT</div>
          <div>
            <div className="logo-text">Golf Task</div>
          </div>
        </div>

        {/* Projects */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Projects</div>
          {projects.map(p => (
            <button key={p.id} className={`project-item${p.id === activeProjectId ? ' active' : ''}`}
              onClick={() => { setActiveProject(p.id); if (page === 'settings') setPage('dashboard') }}>
              <div className="project-dot" style={{ background: p.color || '#0ea5e9' }} />
              <span className="project-name">{p.name}</span>
            </button>
          ))}
          <button className="nav-item" style={{ color: 'var(--text-muted)', fontSize: 12 }} onClick={() => navigate('settings')}>
            <Plus size={12} /> New Project
          </button>
        </div>

        <div className="divider" style={{ margin: '8px 0' }} />

        {/* Nav */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Views</div>
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} className={`nav-item${page === item.id ? ' active' : ''}`} onClick={() => navigate(item.id)}>
                <Icon size={15} />
                {item.label}
                {item.id === 'ai' && <span style={{ marginLeft: 'auto', fontSize: 9, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' }}>AI</span>}
              </button>
            )
          })}
        </div>

        <div style={{ flex: 1 }} />

        <div className="sidebar-section" style={{ paddingBottom: 12 }}>
          <button className={`nav-item${page === 'settings' ? ' active' : ''}`} onClick={() => navigate('settings')}>
            <Settings size={15} /> Settings
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <button className="btn btn-ghost btn-icon" style={{ display: 'none' }} id="menu-btn" onClick={() => setSidebarOpen(s => !s)}>
            <Menu size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(s => !s)} style={{ display: 'flex' }}>
              <Menu size={15} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeProject?.color || '#0ea5e9' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{activeProject?.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{PAGE_TITLES[page]}</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <button className="btn btn-primary btn-sm" onClick={() => setQuickTask(true)}>
            <Plus size={13} /> Quick Add
          </button>

          <div style={{ position: 'relative' }}>
            <button className={`btn btn-ghost btn-icon${showNotif ? ' btn-primary' : ''}`} onClick={() => setShowNotif(s => !s)}>
              <Bell size={15} />
            </button>
            {unread > 0 && (
              <div className="notif-dot" style={{ width: unread > 9 ? 'auto' : 8, padding: unread > 9 ? '0 3px' : 0, fontSize: 9, height: 14, top: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: '#fff', background: 'var(--red)' }}>
                {unread > 9 ? '9+' : unread}
              </div>
            )}
          </div>
        </header>

        <main className="content-area">
          {renderPage()}
        </main>
      </div>

      {/* Notification Panel */}
      {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} />}

      {/* Quick Add Modal */}
      {quickTask && <TaskModal onClose={() => setQuickTask(false)} />}
    </div>
  )
}
