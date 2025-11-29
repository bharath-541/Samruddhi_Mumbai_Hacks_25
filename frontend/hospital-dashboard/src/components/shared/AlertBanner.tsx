import React, { useState } from 'react';
import { Alert, AlertType, Severity } from '@/types';
import { cn } from '@/lib/utils';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  X, 
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AlertBannerProps {
  alert: Alert;
  onDismiss?: (alertId: string) => void;
  dismissible?: boolean;
  expandable?: boolean;
}

const AlertBanner: React.FC<AlertBannerProps> = ({ 
  alert, 
  onDismiss, 
  dismissible = true,
  expandable = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const getAlertConfig = (type: AlertType, severity: Severity) => {
    const baseConfig = {
      surge: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      },
      warning: {
        icon: <AlertCircle className="w-5 h-5" />,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      info: {
        icon: <Info className="w-5 h-5" />,
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      }
    };

    const config = baseConfig[type];

    // Intensify colors for high severity
    if (severity === 'high') {
      return {
        ...config,
        bgColor: type === 'surge' ? 'bg-red-100' : type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100',
        borderColor: type === 'surge' ? 'border-red-300' : type === 'warning' ? 'border-yellow-300' : 'border-blue-300'
      };
    }

    return config;
  };

  const alertConfig = getAlertConfig(alert.type, alert.severity);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(alert.id);
    }, 300); // Allow animation to complete
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getSeverityBadge = (severity: Severity) => {
    const severityConfig = {
      high: { bg: 'bg-red-100', text: 'text-red-700', label: 'HIGH' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'MEDIUM' },
      low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'LOW' }
    };

    const config = severityConfig[severity];
    return (
      <span className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        config.bg,
        config.text
      )}>
        {config.label}
      </span>
    );
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      'border rounded-2xl p-4 border-l-4 transition-all duration-300 ease-in-out',
      alert.type === 'surge' ? 'bg-red-50 border-red-200 border-l-red-500 text-red-800' :
      alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200 border-l-yellow-500 text-yellow-800' :
      'bg-blue-50 border-blue-200 border-l-blue-500 text-blue-800',
      isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
    )}>
      <div className="p-4">
        {/* Main Alert Content */}
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={cn('flex-shrink-0 mt-0.5', alertConfig.iconColor)}>
            {alertConfig.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Alert Message */}
                <p className={cn('text-sm font-medium', alertConfig.textColor)}>
                  {alert.message}
                </p>

                {/* Metadata */}
                <div className="flex items-center space-x-3 mt-2">
                  {getSeverityBadge(alert.severity)}
                  
                  <div className="flex items-center space-x-1 text-xs text-clinical-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(alert.timestamp)}</span>
                  </div>

                  <div className="text-xs text-clinical-500">
                    ID: {alert.id.split('-')[0]}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {expandable && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                      'p-1 rounded-lg hover:bg-white/50 transition-colors',
                      alertConfig.iconColor
                    )}
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}

                {dismissible && (
                  <button
                    onClick={handleDismiss}
                    className={cn(
                      'p-1 rounded-lg hover:bg-white/50 transition-colors',
                      alertConfig.iconColor
                    )}
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {expandable && isExpanded && (
          <div className="mt-4 pt-4 border-t border-current/10">
            <div className="text-xs text-clinical-600 space-y-2">
              <div>
                <span className="font-medium">Alert Type:</span> {alert.type.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Severity:</span> {alert.severity.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Timestamp:</span> {alert.timestamp.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Alert ID:</span> {alert.id}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animated border for high severity alerts */}
      {alert.severity === 'high' && (
        <div className="h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20 animate-pulse" />
      )}
    </div>
  );
};

export default AlertBanner;