import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Overview', icon: 'overview', to: '/dashboard' },
  { key: 'goal-management', label: 'Goal Management', icon: 'target', to: '/goal-management' },
  { key: 'profile', label: 'Health Profiles', icon: 'profile', to: '/profile' },
  { key: 'food-search', label: 'Food Search', icon: 'search', to: '/food-search' },
  { key: 'meal-log', label: 'Meal Log', icon: 'book', to: '/meal-log' },
  { key: 'body-review', label: 'Body Review', icon: 'pulse', to: '/body-review' },
  { key: 'reports', label: 'Reports & Insights', icon: 'chart', to: '/reports' },
] as const

type SidebarItemKey = (typeof SIDEBAR_ITEMS)[number]['key']
type SidebarIconName = (typeof SIDEBAR_ITEMS)[number]['icon']

function SidebarIcon({ name }: { name: SidebarIconName }) {
  switch (name) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      )
    case 'profile':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 19a7 7 0 0 1 14 0" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v15H6.5A2.5 2.5 0 0 0 4 21Z" />
          <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v15h5.5A2.5 2.5 0 0 1 20 21Z" />
        </svg>
      )
    case 'pulse':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12h4l2.5-6 4.5 12 2.5-6H21" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20V6" />
          <path d="M10 20v-8" />
          <path d="M16 20V9" />
          <path d="M22 20H2" />
        </svg>
      )
    case 'target':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
        </svg>
      )
  }
}

interface DashboardShellProps {
  activeItem: SidebarItemKey
  title: string
  subtitle: string
  action?: ReactNode
  children: ReactNode
  mainClassName?: string
}

function DashboardShell({
  activeItem,
  title,
  subtitle,
  action,
  children,
  mainClassName = '',
}: DashboardShellProps) {
  const navigate = useNavigate()
  const { signOut } = useAuth()

  function handleLogout() {
    signOut()
    navigate('/')
  }
  return (
    <main className="dashboard-page">
      <aside className="dashboard-sidebar">
        <Link className="brand dashboard-brand__link" to="/">
          <span className="brand__name">HealthyBite</span>
          <span className="brand__mark">Leaf</span>
        </Link>

        <Link className="dashboard-profile-card dashboard-profile-card--link" to="/profile">
          <div className="dashboard-profile-card__avatar">H</div>
          <div>
            <strong>My Profile</strong>
            <p>View and update your health information</p>
          </div>
        </Link>

        <nav className="dashboard-nav" aria-label="Dashboard menu">
          {SIDEBAR_ITEMS.map((item) => (
            <Link
              key={item.key}
              className={`dashboard-nav__item${item.key === activeItem ? ' dashboard-nav__item--active' : ''}`}
              to={item.to}
            >
              <span className="dashboard-nav__icon" aria-hidden="true">
                <SidebarIcon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="dashboard-sidebar__footer">
          <button className="dashboard-logout" type="button" onClick={handleLogout}>
            <span className="dashboard-logout__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M10 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3" />
                <path d="M14 8l5 4-5 4" />
                <path d="M19 12H9" />
              </svg>
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <section className={`dashboard-main ${mainClassName}`.trim()}>
        <header className="dashboard-topbar">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="dashboard-topbar__actions">{action}</div>
        </header>

        {children}
      </section>
    </main>
  )
}

export default DashboardShell
