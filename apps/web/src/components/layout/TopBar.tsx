import { NavLink, useNavigate } from 'react-router-dom';
import { FileText, BarChart3, Bell, LogOut, BookOpen } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { UserRole } from '@biopropose/shared-types';
import clsx from 'clsx';

const ROLE_LABELS: Record<string, string> = {
  [UserRole.PROPOSAL_MANAGER]: 'Proposal Manager',
  [UserRole.QA_QC]: 'SME / Reviewer',
  [UserRole.MANAGEMENT]: 'Management',
};

export default function TopBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isProposalManager = user?.role === UserRole.PROPOSAL_MANAGER;
  const firstName = user?.name?.split(' ')[0] ?? 'User';
  const roleLabel = ROLE_LABELS[user?.role ?? ''] ?? user?.role ?? '';

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Biologics RFP Platform</p>
              <p className="text-xs text-gray-500 leading-tight">Proposal Management System</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center space-x-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-800 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                )
              }
            >
              <BarChart3 size={15} />
              Dashboard
            </NavLink>

            <NavLink
              to="/templates"
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-800 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                )
              }
            >
              <BookOpen size={15} />
              Template Library
            </NavLink>

            <NavLink
              to="/proposals"
              end
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-800 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                )
              }
            >
              <FileText size={15} />
              Proposals
            </NavLink>

            {isProposalManager && (
              <button
                onClick={() => navigate('/proposals/new')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                New Proposal
              </button>
            )}
          </nav>

          {/* User */}
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Bell size={18} />
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight">{firstName}</p>
              <p className="text-xs text-gray-500 leading-tight">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
