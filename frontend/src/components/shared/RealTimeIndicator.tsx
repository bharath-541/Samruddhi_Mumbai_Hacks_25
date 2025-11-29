import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw, 
  Pause, 
  Play,
  Circle
} from 'lucide-react';

interface RealTimeIndicatorProps {
  isActive: boolean;
  lastUpdate: Date | null;
  onToggle?: () => void;
  onForceUpdate?: () => void;
  variant?: 'minimal' | 'detailed' | 'badge';
  className?: string;
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  isActive,
  lastUpdate,
  onToggle,
  onForceUpdate,
  variant = 'minimal',
  className
}) => {
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (variant === 'badge') {
    return (
      <div className={cn(
        'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
        isActive ? 'bg-green-100 text-green-700' : 'bg-clinical-100 text-clinical-600',
        className
      )}>
        <Circle className={cn(
          'w-2 h-2 fill-current',
          isActive && 'animate-pulse'
        )} />
        <span>{isActive ? 'Live' : 'Paused'}</span>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={cn(
        'flex items-center space-x-2 text-sm text-clinical-500',
        className
      )}>
        {isActive ? (
          <Wifi className="w-4 h-4 text-green-500" />
        ) : (
          <WifiOff className="w-4 h-4 text-clinical-400" />
        )}
        <span>
          {isActive ? 'Live' : 'Offline'} • {formatLastUpdate(lastUpdate)}
        </span>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 bg-white border border-clinical-200 rounded-xl shadow-soft',
      className
    )}>
      {/* Status Indicator */}
      <div className="flex items-center space-x-2">
        {isActive ? (
          <div className="flex items-center space-x-1">
            <Circle className="w-2 h-2 fill-green-500 text-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1">
            <Circle className="w-2 h-2 fill-clinical-400 text-clinical-400" />
            <span className="text-sm font-medium text-clinical-600">Paused</span>
          </div>
        )}
      </div>

      {/* Last Update */}
      <div className="flex items-center space-x-1 text-sm text-clinical-500">
        <Clock className="w-3 h-3" />
        <span>{formatLastUpdate(lastUpdate)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-1">
        {onToggle && (
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-clinical-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title={isActive ? 'Pause updates' : 'Resume updates'}
          >
            {isActive ? (
              <Pause className="w-4 h-4 text-clinical-600" />
            ) : (
              <Play className="w-4 h-4 text-clinical-600" />
            )}
          </button>
        )}

        {onForceUpdate && (
          <button
            onClick={onForceUpdate}
            className="p-1 rounded-lg hover:bg-clinical-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            title="Force update now"
          >
            <RefreshCw className="w-4 h-4 text-clinical-600" />
          </button>
        )}
      </div>
    </div>
  );
};

export default RealTimeIndicator;