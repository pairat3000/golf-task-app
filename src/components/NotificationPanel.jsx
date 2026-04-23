import { Bell, X, Check, CheckCheck } from 'lucide-react'
import { useStore } from '../store'
import { formatDate } from '../lib/utils'

export default function NotificationPanel({ onClose }) {
  const { notifications, markNotificationRead, markAllRead, clearNotification } = useStore()

  return (
    <div className="notif-panel">
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={15} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
          {notifications.filter(n => !n.read).length > 0 && (
            <span style={{ fontSize: 10, background: 'var(--red)', color: '#fff', padding: '1px 6px', borderRadius: 10, fontFamily: 'var(--font-mono)' }}>
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {notifications.some(n => !n.read) && (
            <button className="btn btn-ghost btn-sm" onClick={markAllRead} title="Mark all read">
              <CheckCheck size={13} />
            </button>
          )}
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={14} /></button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <Bell size={32} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 13 }}>No notifications</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              background: notif.read ? 'transparent' : 'rgba(14,165,233,0.04)',
              display: 'flex', gap: 10, alignItems: 'flex-start'
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50', marginTop: 5, flexShrink: 0,
                background: notif.type === 'danger' ? 'var(--red)' : 'var(--amber)',
                opacity: notif.read ? 0.3 : 1
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: notif.read ? 400 : 500, fontSize: 13, marginBottom: 2 }}>{notif.title}</div>
                <div style={{
                  fontSize: 12,
                  color: notif.type === 'danger' ? 'var(--red)' : 'var(--amber)',
                  fontWeight: 500
                }}>{notif.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                  {new Date(notif.createdAt).toLocaleDateString('th-TH')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                {!notif.read && (
                  <button className="btn btn-ghost btn-icon" style={{ width: 24, height: 24, padding: 0 }}
                    onClick={() => markNotificationRead(notif.id)} title="Mark read">
                    <Check size={12} />
                  </button>
                )}
                <button className="btn btn-ghost btn-icon" style={{ width: 24, height: 24, padding: 0 }}
                  onClick={() => clearNotification(notif.id)} title="Dismiss">
                  <X size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
