import React from 'react';
import { SystemStatus, Priority, RecommendationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { CheckCircle, Clock, XCircle, Edit3, AlertTriangle } from 'lucide-react';

interface ClinicalBadgeProps {
  variant: 'status' | 'priority' | 'recommendation';
  value: SystemStatus | Priority | RecommendationStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const ClinicalBadge: React.FC<ClinicalBadgeProps> = ({
  variant,
  value,
  size = 'md',
  showIcon = true,
  className
}) => {
  const getStatusConfig = (status: SystemStatus) => {
    switch (status) {
      case 'normal':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Normal',
          className: 'status-badge status-badge-normal'
        };
      case 'alert':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'Alert',
          className: 'status-badge status-badge-alert'
        };
      case 'surge':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'Surge',
          className: 'status-badge status-badge-surge'
        };
    }
  };

  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'High Priority',
          className: 'status-badge priority-high'
        };
      case 'medium':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Medium Priority',
          className: 'status-badge priority-medium'
        };
      case 'low':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Low Priority',
          className: 'status-badge priority-low'
        };
    }
  };

  const getRecommendationConfig = (status: RecommendationStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-3 h-3" />,
          label: 'Pending',
          className: 'status-badge status-badge-alert'
        };
      case 'accepted':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Accepted',
          className: 'status-badge status-badge-normal'
        };
      case 'dismissed':
        return {
          icon: <XCircle className="w-3 h-3" />,
          label: 'Dismissed',
          className: 'status-badge status-badge-surge'
        };
      case 'modified':
        return {
          icon: <Edit3 className="w-3 h-3" />,
          label: 'Modified',
          className: 'status-badge status-badge-alert'
        };
    }
  };

  const getSizeClasses = (size: 'sm' | 'md' | 'lg') => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'lg':
        return 'text-sm px-4 py-2';
      default:
        return 'text-xs px-3 py-1.5';
    }
  };

  let config;
  switch (variant) {
    case 'status':
      config = getStatusConfig(value as SystemStatus);
      break;
    case 'priority':
      config = getPriorityConfig(value as Priority);
      break;
    case 'recommendation':
      config = getRecommendationConfig(value as RecommendationStatus);
      break;
  }

  return (
    <span className={cn(
      config.className,
      getSizeClasses(size),
      className
    )}>
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};

export default ClinicalBadge;