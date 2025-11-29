import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProps } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Home,
  BarChart3, 
  TrendingUp, 
  CheckCircle, 
  HelpCircle, 
  Menu,
  X,
  Activity,
  Users,
  Bed,
  Heart,
  Upload,
  Download,
  FileText,
  Settings,
  Hospital,
  AlertTriangle,
  Clock,
  Stethoscope,
  Shield,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  badge?: string;
  color: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    description: 'Hospital operations overview',
    color: 'medical'
  },
  {
    id: 'predictions',
    label: 'Predictions',
    icon: <TrendingUp className="w-5 h-5" />,
    description: 'AI patient surge forecasts',
    color: 'teal'
  },
  {
    id: 'recommendations',
    label: 'Recommendations',
    icon: <CheckCircle className="w-5 h-5" />,
    description: 'Smart resource actions',
    color: 'clinical'
  },
  {
    id: 'explainability',
    label: 'Explainability',
    icon: <HelpCircle className="w-5 h-5" />,
    description: 'AI insights & reasoning',
    color: 'yellow'
  }
];const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isMobile, 
  isCollapsed, 
  onToggle 
}) => {
  const location = useLocation();
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    // Auto-collapse on mobile after selection
    if (isMobile && !isCollapsed) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'bg-white border-r border-gray-200 transition-all duration-300 ease-in-out',
        'flex flex-col h-full',
        // Desktop styles - Clean minimal width
        'lg:relative lg:z-auto',
        !isMobile && isCollapsed ? 'lg:w-16' : 'lg:w-64',
        // Mobile styles
        isMobile ? [
          'fixed inset-y-0 left-0 z-50 w-64',
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        ] : ''
      )}>
        {/* Header */}
        <div className={cn(
          "border-b border-gray-200 bg-white transition-all duration-300",
          !isMobile && isCollapsed ? "p-3" : "px-5 py-4"
        )}>
          <div className={cn(
            "flex items-center transition-all duration-300",
            !isMobile && isCollapsed ? "justify-center" : "justify-between"
          )}>
            {(!isCollapsed || isMobile) && (
              <div className="flex items-center space-x-2.5 flex-1">
                <img 
                  src="/logo.webp" 
                  alt="Samruddhi Logo" 
                  className="w-7 h-7 object-contain flex-shrink-0"
                />
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">Samruddhi</h2>
                  <p className="text-xs text-gray-500">Operations</p>
                </div>
              </div>
            )}
            
            {isCollapsed && !isMobile && (
              <img 
                src="/logo.webp" 
                alt="Samruddhi Logo" 
                className="w-7 h-7 object-contain"
              />
            )}
            
            {/* Hamburger Menu Button */}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-500 hover:text-gray-900"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {/* Main Navigation */}
          <div className="px-3 space-y-1">
            {navigationItems.map((item) => {
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    'group relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-gray-900 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {(!isCollapsed || isMobile) ? (
                    <div className="flex items-center w-full gap-3">
                      <div className="flex items-center justify-center">
                        {item.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{item.label}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full">
                      {item.icon}
                    </div>
                  )}
                  
                  {/* Show tooltip on collapsed state */}
                  {isCollapsed && !isMobile && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;