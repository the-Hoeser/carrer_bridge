import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Compass, BookOpen, FileText, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { logout } from '../firebase';

export function Sidebar() {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Career Guide', href: '/career-guide', icon: Compass },
    { name: 'Learning', href: '/learning', icon: BookOpen },
    { name: 'Resume Builder', href: '/resume', icon: FileText },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-black/5 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-8">
        <h1 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          CareerBridge
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.href;
          return (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#F5F5F7] text-[#1D1D1F]" 
                  : "text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]/50"
              )}
            >
              <Icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-black/5">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-[#86868B] hover:text-[#FF2D55] hover:bg-[#FF2D55]/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
