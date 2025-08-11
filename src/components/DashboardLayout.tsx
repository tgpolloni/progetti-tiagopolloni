'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { 
  Home, 
  FolderOpen, 
  Users, 
  FileText, 
  Mail, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Progetti', href: '/dashboard/progetti', icon: FolderOpen },
  { name: 'Clienti', href: '/dashboard/clienti', icon: Users },
  { name: 'Briefing', href: '/dashboard/briefing', icon: FileText },
  { name: 'Email', href: '/dashboard/email', icon: Mail },
  { name: 'Impostazioni', href: '/dashboard/impostazioni', icon: Settings },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  // Auto-logout dopo 3 minuti di inattività (solo in dashboard)
  useEffect(() => {
    if (!user) return;

    let inactivityTimer: ReturnType<typeof setTimeout> | undefined;

    const startTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // Effettua logout e reindirizza
        handleLogout();
      }, 3 * 60 * 1000); // 3 minutos
    };

    const resetTimer = () => startTimer();

    // Eventi che indicano attività dell'utente
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'scroll',
      'click',
      'touchstart'
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });
    // Cambiamento di visibilità della pagina
    const onVisibility = () => {
      if (document.visibilityState === 'visible') startTimer();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Avvia timer all'ingresso in pagina
    startTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar per mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1 items-center">
              <Logo width={136} height={40} className="h-8 w-auto" />
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <span className="hidden sm:inline text-sm text-gray-700 mr-4 max-w-[40vw] truncate">
                Benvenuto, {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ pathname, onLogout }: { pathname: string; onLogout: () => void }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col pt-5 pb-4">
        <div className="flex flex-shrink-0 items-center px-4">
          <Logo width={136} height={40} className="h-10 w-auto" />
        </div>
        <nav className="mt-8 flex-1 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-shrink-0 border-t border-gray-200 p-4">
        <Button
          variant="ghost"
          onClick={onLogout}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Esci
        </Button>
      </div>
    </div>
  );
}

function Logo({ width, height, className }: { width: number; height: number; className?: string }) {
  return (
    <Image src="/gesti-logo.png" alt="Gesti Solutions" width={width} height={height} className={className} priority />
  );
}