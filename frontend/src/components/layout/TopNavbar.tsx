import React, { useState, useEffect } from 'react';
import { TopNavbarProps, SystemStatus } from '@/types';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import RealTimeIndicator from '@/components/shared/RealTimeIndicator';
import { cn } from '@/lib/utils';

const TopNavbar: React.FC<TopNavbarProps> = ({ title, currentTime, status }) => {
  const [time, setTime] = useState(currentTime);

  // Real-time clock updates
  const clockUpdates = useRealTimeUpdates({
    interval: 1000, // Update every second
    enabled: true,
    onUpdate: () => {
      setTime(new Date());
    }
  });

  const getStatusConfig = (status: SystemStatus) => {
    switch (status) {
      case 'normal':
        return {
          icon: '🟢',
          text: 'Normal',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'alert':
        return {
          icon: '🟠',
          text: 'Alert',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'surge':
        return {
          icon: '🔴',
          text: 'Surge',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      default:
        return {
          icon: '🟢',
          text: 'Normal',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <nav className="bg-white border-b border-clinical-200 px-4 py-3 shadow-soft">
      <div className="flex items-center justify-between">
        {/* Left side - Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-clinical-800 md:text-2xl">
            {title}
          </h1>
        </div>

        {/* Right side - Time and Status */}
        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Current Time */}
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-sm font-medium text-clinical-700">
              {formatTime(time)}
            </div>
            <RealTimeIndicator
              isActive={clockUpdates.isActive}
              lastUpdate={clockUpdates.lastUpdate}
              variant="minimal"
              className="text-xs"
            />
          </div>

          {/* Mobile Time - Simplified */}
          <div className="sm:hidden flex flex-col items-end">
            <div className="text-sm font-medium text-clinical-700">
              {time.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={cn(
            'flex items-center space-x-2 px-3 py-2 rounded-2xl border',
            statusConfig.bgColor,
            statusConfig.borderColor
          )}>
            <span className="text-lg" role="img" aria-label={`Status: ${statusConfig.text}`}>
              {statusConfig.icon}
            </span>
            <span className={cn('font-medium text-sm', statusConfig.textColor)}>
              {statusConfig.text}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile-only second row for full date/time */}
      <div className="sm:hidden mt-2 pt-2 border-t border-clinical-100">
        <div className="flex items-center justify-between text-xs text-clinical-500">
          <span>{formatTime(time)}</span>
          <RealTimeIndicator
            isActive={clockUpdates.isActive}
            lastUpdate={clockUpdates.lastUpdate}
            variant="badge"
          />
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;