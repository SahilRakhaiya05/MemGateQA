import { Link, useLocation } from 'react-router-dom';
import { NAV } from '../copy/brand';

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Home', exact: true },
  { to: '/studio', icon: '◈', label: 'Studio', exact: false },
  { to: '/agents/create', icon: '➕', label: 'Build', exact: false },
  { to: '/agents', icon: '🤖', label: 'Agents', exact: false },
  { to: '/settings', icon: '⚙️', label: NAV.settings.label, exact: false },
] as const;

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav md:hidden" aria-label="Mobile">
      {ITEMS.map((item) => {
        const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
        return (
          <Link key={item.to} className={`mobile-nav-item ${active ? 'active' : ''}`} title={item.label} to={item.to}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}