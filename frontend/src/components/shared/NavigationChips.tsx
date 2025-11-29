import React from 'react';
import { Home, BarChart3, Activity, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationChip {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  path: string;
}

interface NavigationChipsProps {
  activeChip: string;
  onChipChange: (chipId: string, path: string) => void;
  className?: string;
}

const NavigationChips: React.FC<NavigationChipsProps> = ({
  activeChip,
  onChipChange,
  className = ''
}) => {
  const navigationChips: NavigationChip[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      description: 'Weather & Regional Health',
      path: '/home'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Hospital Analytics',
      path: '/dashboard'
    }
  ];

  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {navigationChips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipChange(chip.id, chip.path)}
          className={cn(
            "group relative flex items-center gap-3 px-5 py-3 rounded-lg transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2",
            "shadow-sm hover:shadow-md",
            activeChip === chip.id
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
          )}
        >
          {/* Icon */}
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
            activeChip === chip.id
              ? "bg-white/20"
              : "bg-soft-blue-100"
          )}>
            <div className={activeChip === chip.id ? "text-white" : "text-gray-600"}>
              {chip.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col items-start text-left">
            <span className={cn(
              "font-semibold text-sm leading-tight",
              activeChip === chip.id ? "text-white" : "text-gray-900"
            )}>
              {chip.label}
            </span>
            <span className={cn(
              "text-xs leading-tight mt-0.5",
              activeChip === chip.id ? "text-gray-300" : "text-gray-500"
            )}>
              {chip.description}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

// Quick stats chips for the home page
interface QuickStatChip {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
}

interface QuickStatsChipsProps {
  stats: QuickStatChip[];
  className?: string;
}

export const QuickStatsChips: React.FC<QuickStatsChipsProps> = ({
  stats,
  className = ''
}) => {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className={cn(
            "relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100",
            "transition-all duration-300 hover:shadow-xl hover:scale-105",
            "overflow-hidden"
          )}
        >
          {/* Background gradient */}
          <div className={cn(
            "absolute inset-0 opacity-5",
            stat.color
          )}></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "p-2 rounded-xl",
                stat.color.replace('bg-', 'bg-').replace('-500', '-50'),
                stat.color.replace('bg-', 'text-')
              )}>
                {stat.icon}
              </div>
              {stat.trend && (
                <div className={cn(
                  "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                  stat.trend > 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                  {stat.trend > 0 ? '+' : ''}{stat.trend}%
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </div>
            <div className="text-sm text-gray-600">
              {stat.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NavigationChips;
