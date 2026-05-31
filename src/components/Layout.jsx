import { NavLink, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const TABS = [
  { to: '/', ic: '🏠', label: 'Home', end: true },
  { to: '/market', ic: '🛒', label: 'Market' },
  { to: '/history', ic: '📜', label: 'History' },
  { to: '/profile', ic: '🧑‍🚀', label: 'Me' },
]

export default function Layout({ children }) {
  const { displayName, avatar } = useApp()
  const { pathname } = useLocation()
  const onDetail = pathname.startsWith('/stock/')

  return (
    <div className="app-shell">
      {!onDetail && (
        <div className="topbar">
          <div className="hi">Hi, {displayName}! 👋</div>
          <div className="ava">{avatar || '🧑‍🚀'}</div>
        </div>
      )}
      {children}
      <nav className="nav">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="ic">{t.ic}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
