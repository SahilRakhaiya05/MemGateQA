import { Link, useLocation } from 'react-router-dom';

const ITEMS = [
  { to: '/', icon: '🏠', label: 'Home', exact: true },
  { to: '/cases/case-wolfpack', icon: '🐺', label: 'Demo', exact: false },
  { to: '/cases/new', icon: '➕', label: 'New', exact: false },
] as const;

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="mobile-nav md:hidden">
      {ITEMS.map((item) => {
        const active = item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
        return (
          <Link key={item.to} className={`mobile-nav-item ${active ? 'active' : ''}`} to={item.to}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}