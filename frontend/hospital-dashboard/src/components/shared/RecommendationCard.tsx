import React from 'react';
import { Recommendation, RecommendationCategory, Priority, RecommendationStatus } from '@/types';
import TouchOptimized from '@/components/shared/TouchOptimized';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Package, 
  MessageSquare, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  Edit3,
  ChevronRight
} from 'lucide-react';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAction: (id: string, action: 'accept' | 'modify' | 'dismiss') => void;
  isLoading?: boolean;
  className?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAction,
  isLoading = false,
  className
}) => {
  const { id, category, title, description, priority, status, createdAt } = recommendation;

  // Get category configuration
  const getCategoryConfig = (category: RecommendationCategory) => {
    switch (category) {
      case 'staffing':
        return {
          icon: <Users className="w-5 h-5" />,
          label: 'Staffing Plan',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-700'
        };
      case 'supplies':
        return {
          icon: <Package className="w-5 h-5" />,
          label: 'Supplies Plan',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          iconColor: 'text-green-600',
          badgeColor: 'bg-green-100 text-green-700'
        };
      case 'advisory':
        return {
          icon: <MessageSquare className="w-5 h-5" />,
          label: 'Patient Advisory',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-700'
        };
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          label: 'General',
          bgColor: 'bg-clinical-50',
          borderColor: 'border-clinical-200',
          iconColor: 'text-clinical-600',
          badgeColor: 'bg-clinical-100 text-clinical-700'
        };
    }
  };

  // Get priority configuration
  const getPriorityConfig = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return {
          label: 'HIGH',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
      case 'low':
        return {
          label: 'LOW',
          bgColor: 'bg-clinical-100',
          textColor: 'text-clinical-700',
          borderColor: 'border-clinical-200'
        };
      default:
        return {
          label: 'NORMAL',
          bgColor: 'bg-clinical-100',
          textColor: 'text-clinical-700',
          borderColor: 'border-clinical-200'
        };
    }
  };

  // Get status configuration
  const getStatusConfig = (status: RecommendationStatus) => {
    switch (status) {
      case 'accepted':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Accepted',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-200'
        };
      case 'dismissed':
        return {
          icon: <XCircle className="w-4 h-4" />,
          label: 'Dismissed',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-200'
        };
      case 'modified':
        return {
          icon: <Edit3 className="w-4 h-4" />,
          label: 'Modified',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200'
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          label: 'Pending',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const categoryConfig = getCategoryConfig(category);
  const priorityConfig = getPriorityConfig(priority);
  const statusConfig = getStatusConfig(status);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleAction = (action: 'accept' | 'modify' | 'dismiss') => {
    if (!isLoading && status === 'pending') {
      onAction(id, action);
    }
  };

  return (
    <div className={cn(
      'bg-white border rounded-2xl shadow-soft transition-all duration-200 hover:shadow-md',
      categoryConfig.borderColor,
      isLoading && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* Header */}
      <div className={cn('p-4 border-b border-current/10', categoryConfig.bgColor)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn('p-2 rounded-lg bg-white/50', categoryConfig.iconColor)}>
              {categoryConfig.icon}
            </div>
            <div>
              <div className={cn('text-xs font-medium px-2 py-1 rounded-full', categoryConfig.badgeColor)}>
                {categoryConfig.label}
              </div>
              <h3 className="text-lg font-semibold text-clinical-800 mt-1">{title}</h3>
            </div>
          </div>
          
          {/* Priority Badge */}
          <div className={cn(
            'px-2 py-1 rounded-full text-xs font-bold border',
            priorityConfig.bgColor,
            priorityConfig.textColor,
            priorityConfig.borderColor
          )}>
            {priorityConfig.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-clinical-700 text-sm leading-relaxed mb-4">
          {description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-clinical-500 mb-4">
          <div className="flex items-center space-x-4">
            <span>Created: {formatTimeAgo(createdAt)}</span>
            <span>ID: {id.split('-')[0]}</span>
          </div>
          
          {/* Status Badge */}
          <div className={cn(
            'flex items-center space-x-1 px-2 py-1 rounded-full border',
            statusConfig.bgColor,
            statusConfig.textColor,
            statusConfig.borderColor
          )}>
            {statusConfig.icon}
            <span className="font-medium">{statusConfig.label}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {status === 'pending' && (
          <div className="flex items-center space-x-2">
            <TouchOptimized
              as="button"
              onClick={() => handleAction('accept')}
              disabled={isLoading}
              variant="button"
              className={cn(
                'flex-1 flex items-center justify-center space-x-2 rounded-xl',
                'bg-green-50 border border-green-200 text-green-700 font-medium text-sm',
                'hover:bg-green-100 hover:border-green-300 transition-colors'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              <span>Accept</span>
            </TouchOptimized>

            <TouchOptimized
              as="button"
              onClick={() => handleAction('modify')}
              disabled={isLoading}
              variant="button"
              className={cn(
                'flex-1 flex items-center justify-center space-x-2 rounded-xl',
                'bg-blue-50 border border-blue-200 text-blue-700 font-medium text-sm',
                'hover:bg-blue-100 hover:border-blue-300 transition-colors'
              )}
            >
              <Edit3 className="w-4 h-4" />
              <span>Modify</span>
            </TouchOptimized>

            <TouchOptimized
              as="button"
              onClick={() => handleAction('dismiss')}
              disabled={isLoading}
              variant="button"
              className={cn(
                'flex-1 flex items-center justify-center space-x-2 rounded-xl',
                'bg-red-50 border border-red-200 text-red-700 font-medium text-sm',
                'hover:bg-red-100 hover:border-red-300 transition-colors'
              )}
            >
              <XCircle className="w-4 h-4" />
              <span>Dismiss</span>
            </TouchOptimized>
          </div>
        )}

        {/* Completed Actions Message */}
        {status !== 'pending' && (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl border',
            statusConfig.bgColor,
            statusConfig.borderColor
          )}>
            <div className="flex items-center space-x-2">
              {statusConfig.icon}
              <span className={cn('text-sm font-medium', statusConfig.textColor)}>
                This recommendation has been {status}
              </span>
            </div>
            <ChevronRight className={cn('w-4 h-4', statusConfig.textColor)} />
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-2xl">
          <div className="flex items-center space-x-2 text-clinical-600">
            <div className="w-4 h-4 border-2 border-clinical-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="text-sm">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;