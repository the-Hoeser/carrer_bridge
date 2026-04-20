import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, FileText, LogOut, Sparkles, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { logout } from '../firebase';
import { useAuth } from './AuthContext';

const LINKS = [
  { name: 'Dashboard',     href: '/dashboard',    icon: LayoutDashboard },
  { name: 'Career Guide',  href: '/career-guide', icon: Compass },
  { name: 'Learning Hub',  href: '/learning',     icon: BookOpen },
  { name: 'Resume Builder',href: '/resume',       icon: FileText },
  { name: 'Settings',      href: '/settings',     icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 h-screen bg-white border-r border-black/6 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-black/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
            <Sparkles className="w-4.5 h-4.5 text-white w-[18px] h-[18px]" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-[#1C1C1E] tracking-tight leading-none">CareerBridge</h1>
            <p className="text-[10px] text-[#8E8E93] mt-0.5">AI Career Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-[#F2F2F7] text-[#1C1C1E] font-semibold'
                  : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-[#F2F2F7]/60'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0',
                isActive
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-200'
                  : 'bg-transparent group-hover:bg-black/5'
              )}>
                <Icon className={cn('w-4 h-4', isActive ? 'text-white' : '')} />
              </div>
              {link.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-black/5 space-y-2">
        {/* User chip */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F2F2F7]">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                {user.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-[#1C1C1E] truncate">{user.displayName || 'User'}</p>
              <p className="text-[10px] text-[#8E8E93] truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-[13px] font-medium text-[#8E8E93] hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <LogOut className="w-4 h-4" />
          </div>
          Sign Out
        </button>
      </div>
    </div>
  );
}
