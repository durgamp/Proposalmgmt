import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, ChevronLeft, Library } from 'lucide-react';
import { useProposalStore } from '../../stores/proposalStore';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/proposals', label: 'Proposals', icon: FileText },
  { to: '/templates', label: 'Templates', icon: Library },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useProposalStore();

  return (
    <aside
      className={clsx(
        'fixed left-0 top-0 h-full bg-brand-800 text-white flex flex-col transition-all z-40',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-brand-700">
        <div>
          <span className="font-bold text-lg tracking-tight">BioPropose</span>
          <p className="text-xs text-blue-300 mt-0.5">Proposal Management</p>
        </div>
        <button onClick={toggleSidebar} className="text-blue-300 hover:text-white">
          <ChevronLeft size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white',
              )
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 text-xs text-blue-400 border-t border-brand-700">
        v1.0.0
      </div>
    </aside>
  );
}
