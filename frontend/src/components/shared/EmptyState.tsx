import React from 'react';
import { cn } from '@/lib/utils';
import { 
  FileX, 
  AlertCircle, 
  Search, 
  Database, 
  Wifi, 
  RefreshCw,
  Plus,
  Filter
} from 'lucide-react';

interface EmptyStateProps {
  variant?: 'no-data' | 'no-results' | 'error' | 'offline' | 'loading-failed';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  title,
  description,
  icon,
  action,
  className
}) => {
  const getDefaultConfig = () => {
    switch (variant) {
      case 'no-results':
        return {
          icon: <Search className="w-16 h-16 text-clinical-400" />,
          title: 'No results found',
          description: 'Try adjusting your search or filter criteria to find what you\'re looking for.'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-16 h-16 text-red-400" />,
          title: 'Unable to load data',
          description: 'There was a problem loading the information. Please try again.'
        };
      case 'offline':
        return {
          icon: <Wifi className="w-16 h-16 text-clinical-400" />,
          title: 'No internet connection',
          description: 'Please check your connection and try again.'
        };
      case 'loading-failed':
        return {
          icon: <Database className="w-16 h-16 text-clinical-400" />,
          title: 'Failed to load',
          description: 'Something went wrong while loading the data.'
        };
      default: // no-data
        return {
          icon: <FileX className="w-16 h-16 text-clinical-400" />,
          title: 'No data available',
          description: 'There is no information to display at this time.'
        };
    }
  };

  const config = getDefaultConfig();
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-12 px-6',
      className
    )}>
      {/* Icon */}
      <div className="mb-6">
        {displayIcon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-clinical-800 mb-3">
        {displayTitle}
      </h3>

      {/* Description */}
      <p className="text-clinical-600 max-w-md leading-relaxed mb-6">
        {displayDescription}
      </p>

      {/* Action Button */}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-offset-2',
            action.variant === 'secondary' ? [
              'bg-clinical-100 text-clinical-700 hover:bg-clinical-200',
              'focus:ring-clinical-500'
            ] : [
              'bg-blue-600 text-white hover:bg-blue-700',
              'focus:ring-blue-500'
            ]
          )}
        >
          {variant === 'error' || variant === 'loading-failed' ? (
            <RefreshCw className="w-4 h-4" />
          ) : variant === 'no-results' ? (
            <Filter className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

// Predefined empty states for common scenarios
export const NoDataState: React.FC<{ onRefresh?: () => void }> = ({ onRefresh }) => (
  <EmptyState
    variant="no-data"
    action={onRefresh ? {
      label: 'Refresh',
      onClick: onRefresh,
      variant: 'primary'
    } : undefined}
  />
);

export const NoResultsState: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    variant="no-results"
    action={onClearFilters ? {
      label: 'Clear Filters',
      onClick: onClearFilters,
      variant: 'secondary'
    } : undefined}
  />
);

export const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    variant="error"
    action={onRetry ? {
      label: 'Try Again',
      onClick: onRetry,
      variant: 'primary'
    } : undefined}
  />
);

export const OfflineState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    variant="offline"
    action={onRetry ? {
      label: 'Retry',
      onClick: onRetry,
      variant: 'primary'
    } : undefined}
  />
);

export default EmptyState;