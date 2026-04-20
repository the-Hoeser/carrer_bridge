import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { NotificationSystem } from './NotificationSystem';
import { Menu, X } from 'lucide-react';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-base text-[#1C1C1E] flex selection:bg-blue-200">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 h-full w-64" onClick={e => e.stopPropagation()}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-xl border-b border-black/6 flex items-center justify-between px-4 z-30 md:hidden">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
          <Menu className="w-5 h-5 text-[#8E8E93]" />
        </button>
        <span className="text-[15px] font-bold text-[#1C1C1E]">CareerBridge</span>
        <div className="w-9" />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-5 md:p-8 lg:p-12">
          <Outlet />
        </div>
      </main>

      <NotificationSystem />
    </div>
  );
}
