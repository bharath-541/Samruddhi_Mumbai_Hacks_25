import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Building2,
  Activity,
  Heart,
  TrendingUp,
  Shield,
  Home,
  BarChart3,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';

interface QuickNavigationProps {
  className?: string;
  showBackButton?: boolean;
}

const QuickNavigation: React.FC<QuickNavigationProps> = ({ 
  className = "", 
  showBackButton = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      label: 'Landing Page',
      path: '/',
      icon: Building2,
      gradient: 'from-medical-500 to-teal-600',
      hoverGradient: 'hover:from-medical-600 hover:to-teal-700'
    },
    {
      label: 'Home',
      path: '/home',
      icon: Heart,
      gradient: 'from-teal-500 to-teal-600',
      hoverGradient: 'hover:from-teal-600 hover:to-teal-700'
    },
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Activity,
      gradient: 'from-blue-500 to-blue-600',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700'
    },
    {
      label: 'Overview',
      path: '/overview',
      icon: BarChart3,
      gradient: 'from-purple-500 to-purple-600',
      hoverGradient: 'hover:from-purple-600 hover:to-purple-700'
    }
  ];

  const secondaryItems = [
    {
      label: 'Predictions',
      path: '/predictions',
      icon: TrendingUp,
      textColor: 'text-medical-600 hover:text-medical-800',
      bgColor: 'bg-medical-50 hover:bg-medical-100'
    },
    {
      label: 'Recommendations',
      path: '/recommendations',
      icon: Shield,
      textColor: 'text-teal-600 hover:text-teal-800',
      bgColor: 'bg-teal-50 hover:bg-teal-100'
    },
    {
      label: 'Alerts',
      path: '/explainability',
      icon: AlertTriangle,
      textColor: 'text-orange-600 hover:text-orange-800',
      bgColor: 'bg-orange-50 hover:bg-orange-100'
    }
  ];

  const isCurrentPage = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-medical-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300 text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isCurrent = isCurrentPage(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg text-white ${
                  isCurrent 
                    ? `bg-gradient-to-r ${item.gradient} ring-2 ring-offset-2 ring-medical-300` 
                    : `bg-gradient-to-r ${item.gradient} ${item.hoverGradient}`
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3">
          {secondaryItems.map((item) => {
            const IconComponent = item.icon;
            const isCurrent = isCurrentPage(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium ${
                  isCurrent 
                    ? `${item.textColor} ${item.bgColor} ring-2 ring-offset-2 ring-current ring-opacity-30` 
                    : `${item.textColor} ${item.bgColor}`
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickNavigation;
