import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import TopNavbar from './TopNavbar';
import Sidebar from './Sidebar';
import { SystemStatus } from '@/types';
import { dataService } from '@/services/dataService';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('normal');
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Changed default to false

  const location = useLocation();

  // Check if we're on a page that needs clean layout (should not apply to dashboard)
  const isCleanLayout = location.pathname === '/' || location.pathname === '/register';

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile, but keep it open on desktop by default
      if (mobile) {
        setSidebarCollapsed(true);
      }
      // Don't auto-change desktop sidebar state
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update system status and time periodically
  useEffect(() => {
    const updateStatus = async () => {
      setCurrentTime(new Date());
      const status = await dataService.getSystemStatus();
      setSystemStatus(status);
    };

    // Initial update
    updateStatus();

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
  };

  // Clean layout for landing page and registration - dashboard should use full layout
  if (isCleanLayout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // Standard dashboard layout
  return (
    <div className="min-h-screen bg-gray-50 h-screen overflow-hidden">
      {/* Main Content */}
      <main className="h-full overflow-auto bg-gray-50">
        <div className="p-6 h-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Navigation Menu */}
      <FloatingNavMenu activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};

// Floating Navigation Menu Component
const FloatingNavMenu: React.FC<{ activeTab: string; onTabChange: (tab: string) => void }> = ({
  activeTab,
  onTabChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏥' },
    { id: 'predictions', label: 'Predictions', icon: '📈' },
    { id: 'recommendations', label: 'Recommendations', icon: '✓' },
    { id: 'explainability', label: 'Explainability', icon: '❓' }
  ];

  const handleItemClick = (tabId: string) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Menu Items */}
        {isOpen && (
          <div className="mb-3 space-y-2 animate-fadeIn">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-200 w-full',
                    isActive
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Burger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200',
            isOpen
              ? 'bg-gray-900 text-white rotate-90'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          )}
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>
    </>
  );
};



export default Layout;