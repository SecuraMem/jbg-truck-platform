import { useState } from 'react';
import {
  Truck,
  Package,
  LayoutDashboard,
  MessageSquare,
  Upload,
  Menu,
  X,
  Trash2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onClearAllData?: () => void;
  trucksCount?: number;
  loadsCount?: number;
}

export function Layout({ children, currentView, onViewChange, onClearAllData, trucksCount = 0, loadsCount = 0 }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trucks', label: 'Trucks', icon: Truck },
    { id: 'loads', label: 'Loads', icon: Package },
    { id: 'import', label: 'Import Trucks', icon: Upload },
    { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-jbg-primary text-white shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-jbg-dark rounded-lg transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div>
              <h1 className="text-xl font-bold">JBG Truck Scheduling</h1>
              <p className="text-xs text-green-200">Truth, Fairness & Goodwill</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-green-200">Jamaica Broilers Group</p>
            <p className="text-xs text-green-300">With God's guidance, we serve</p>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:static inset-y-0 left-0 z-40
            w-64 bg-white shadow-lg transform transition-transform duration-200
            lg:transform-none lg:pointer-events-auto
            ${sidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none lg:translate-x-0'}
            pt-16 lg:pt-0
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-colors text-left
                    ${isActive
                      ? 'bg-jbg-primary text-white'
                      : 'text-gray-700 hover:bg-jbg-light'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Bottom Section - Clear Data */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            {onClearAllData && (
              <>
                {!showClearConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                    <span className="text-sm font-medium">Clear All Data</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-center text-red-600 font-medium">
                      Delete {trucksCount} trucks & {loadsCount} loads?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClearAllData();
                          setShowClearConfirm(false);
                        }}
                        className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {!onClearAllData && (
              <div className="text-center text-sm text-gray-500">
                <p className="font-medium text-jbg-primary">Fair Scheduling</p>
                <p className="text-xs mt-1">Every driver deserves equal opportunity</p>
              </div>
            )}
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-64px)] relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
