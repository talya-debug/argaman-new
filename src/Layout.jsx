import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, FolderOpen, CheckSquare,
  Link2, DollarSign, BarChart3, Menu, X, LogOut
} from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import NotificationBell from '@/components/notifications/NotificationBell'

const navigationItems = [
  { to: '/', icon: LayoutDashboard, label: 'לוח בקרה' },
  { to: '/Leads', icon: Users, label: 'לידים' },
  { to: '/Quotes', icon: FileText, label: 'הצעות מחיר' },
  { to: '/Projects', icon: FolderOpen, label: 'פרויקטים' },
  { to: '/Tasks', icon: CheckSquare, label: 'משימות' },
  { to: '/Links', icon: Link2, label: 'קישורים' },
  { to: '/CollectionDashboard', icon: DollarSign, label: 'גבייה' },
  { to: '/Reports', icon: BarChart3, label: 'דוחות' },
]

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  const isMinimalView = currentPageName === 'WorkLogForm'

  if (isMinimalView) {
    return (
      <div dir="rtl" style={{ width: '100%', minHeight: '100vh', background: 'var(--dark)' }}>
        {children}
      </div>
    )
  }

  const navLink = (item) => {
    const isActive = location.pathname === item.to || (item.to === '/' && location.pathname === '/')
    return (
      <Link key={item.to} to={item.to}
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '10px 14px', borderRadius: '8px', textDecoration: 'none',
          fontSize: '14px', fontWeight: 500, marginBottom: '2px',
          color: isActive ? 'var(--argaman)' : 'var(--text-secondary)',
          background: isActive ? 'var(--argaman-bg)' : 'transparent',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'var(--argaman-bg)'; e.currentTarget.style.color = 'var(--argaman-light)' }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}}
      >
        <item.icon size={18} />{item.label}
      </Link>
    )
  }

  const sidebarContent = (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '20px 24px', borderBottom: '1px solid var(--dark-border)'
      }}>
        <img src="/logo.jpg" alt="ארגמן" style={{ height: '44px', borderRadius: '10px' }} />
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--argaman)' }}>ארגמן</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px' }}>מערכות מיזוג</div>
        </div>
      </div>

      <nav style={{ padding: '16px 12px', flex: 1 }}>
        <div style={{ marginBottom: '8px' }}>{navigationItems.map(navLink)}</div>
      </nav>

      <div style={{
        padding: '16px 24px', borderTop: '1px solid var(--dark-border)',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--argaman), var(--argaman-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 600, color: '#fff',
        }}>
          {user?.email?.[0]?.toUpperCase() || 'א'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.full_name || user?.email || 'ארגמן'}
          </div>
        </div>
        {logout && (
          <button onClick={logout} style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '4px'
          }}>
            <LogOut size={16} />
          </button>
        )}
      </div>
    </>
  )

  return (
    <div dir="rtl" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 'var(--sidebar-width)', background: 'var(--dark-sidebar)',
        borderLeft: '2px solid var(--dark-border)', position: 'fixed',
        top: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column',
        zIndex: 100, overflowY: 'auto',
      }} className="desktop-sidebar">{sidebarContent}</aside>

      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 998 }} onClick={() => setMobileOpen(false)} />}

      <aside className="mobile-sidebar" style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px',
        background: 'var(--dark-sidebar)', borderLeft: '1px solid var(--dark-border)',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s', zIndex: 999, display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <button onClick={() => setMobileOpen(false)} style={{
          position: 'absolute', left: '12px', top: '20px',
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
        }}><X size={20} /></button>
        {sidebarContent}
      </aside>

      <main style={{ flex: 1, marginRight: 'var(--sidebar-width)', minHeight: '100vh', background: 'var(--dark)' }}>
        <div style={{
          padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          borderBottom: '1px solid var(--dark-border)',
        }}>
          <NotificationBell />
        </div>

        <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 99,
          background: 'var(--dark-card)', border: '1px solid var(--dark-border)',
          borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--argaman)', display: 'none',
        }}><Menu size={22} /></button>

        <div style={{ padding: '28px 32px' }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          main { margin-right: 0 !important; }
          main > div:last-child { padding: 20px 16px !important; padding-top: 20px !important; }
        }
        @media (min-width: 769px) { .mobile-sidebar { display: none !important; } }
      `}</style>
    </div>
  )
}
