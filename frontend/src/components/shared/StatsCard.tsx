import React from 'react';
import { StatsCardData, SystemStatus } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  data: StatsCardData;
  isLoading?: boolean;
  error?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ data, isLoading = false, error }) => {
  const { title, value, unit, trend, status } = data;

  // Get status-based styling
  const getStatusStyling = (status?: SystemStatus) => {
    switch (status) {
      case 'surge':
        return {
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-600',
          valueColor: 'text-red-700'
        };
      case 'alert':
        return {
          borderColor: 'border-yellow-200',
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-600',
          valueColor: 'text-yellow-700'
        };
      case 'normal':
      default:
        return {
          borderColor: 'border-slate-200',
          bgColor: 'bg-white',
          iconColor: 'text-teal-600',
          valueColor: 'text-slate-800'
        };
    }
  };

  const statusStyling = getStatusStyling(status);

  // Get trend indicator
  const getTrendIndicator = (trend?: number) => {
    if (!trend || trend === 0) {
      return {
        icon: <Minus className="w-4 h-4" />,
        color: 'text-slate-500',
        text: 'No change'
      };
    }

    if (trend > 0) {
      return {
        icon: <TrendingUp className="w-4 h-4" />,
        color: 'text-green-600',
        text: `+${trend}%`
      };
    }

    return {
      icon: <TrendingDown className="w-4 h-4" />,
      color: 'text-red-600',
      text: `${trend}%`
    };
  };

  const trendIndicator = getTrendIndicator(trend);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white border border-clinical-200 rounded-2xl p-6 shadow-soft">
        <div className="animate-pulse">
          <div className="h-4 bg-clinical-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-clinical-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-clinical-200 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center space-x-2 text-red-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="text-sm text-red-700">{error}</p>
        <p className="text-xs text-clinical-500 mt-2">Unable to load {title.toLowerCase()}</p>
      </div>
    );
  }

  return (
    <div className={cn(
      'card-clinical p-6',
      statusStyling.borderColor,
      statusStyling.bgColor
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-clinical-600 uppercase tracking-wide">
          {title}
        </h3>
        {status && status !== 'normal' && (
          <div className={cn(
            'w-2 h-2 rounded-full',
            status === 'surge' ? 'bg-status-surge' : 'bg-status-alert'
          )} />
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-baseline space-x-2 mb-3">
        <span className={cn(
          'text-3xl font-bold font-medical-data',
          statusStyling.valueColor
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        <span className="text-lg text-clinical-500 font-medium">
          {unit}
        </span>
      </div>

      {/* Trend Indicator */}
      {trend !== undefined && (
        <div className="flex items-center space-x-1">
          <div className={cn('flex items-center', trendIndicator.color)}>
            {trendIndicator.icon}
          </div>
          <span className={cn('text-sm font-medium', trendIndicator.color)}>
            {trendIndicator.text}
          </span>
          <span className="text-xs text-clinical-500">
            vs last period
          </span>
        </div>
      )}

      {/* Status-specific messages */}
      {status === 'surge' && (
        <div className="mt-3 text-xs text-red-600 bg-red-100 px-2 py-1 rounded-lg">
          Critical level - immediate attention required
        </div>
      )}
      {status === 'alert' && (
        <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-lg">
          Above normal threshold - monitor closely
        </div>
      )}
    </div>
  );
};

export default StatsCard;