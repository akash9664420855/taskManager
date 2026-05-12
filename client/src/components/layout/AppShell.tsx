import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-60 md:hidden',
              'animate-in slide-in-from-left',
            )}
          >
            <div className="relative h-full">
              <Sidebar onNavigate={() => setDrawerOpen(false)} />
              <button
                type="button"
                aria-label="Close menu"
                className="absolute right-2 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
