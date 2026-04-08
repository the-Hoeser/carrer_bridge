import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-app-base text-[#1D1D1F] flex selection:bg-accent-blue/30">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
