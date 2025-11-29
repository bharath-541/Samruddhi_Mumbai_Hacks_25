import React from 'react';
import { PredictionFilters, EventType, Timeframe } from '@/types';
import { cn } from '@/lib/utils';
import { Filter, Calendar, Activity, ChevronDown } from 'lucide-react';

interface FilterControlsProps {
  filters: PredictionFilters;
  onFilterChange: (filters: PredictionFilters) => void;
  isLoading?: boolean;
  className?: string;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  isLoading = false,
  className
}) => {
  const eventTypeOptions: { value: EventType; label: string; description: string; color: string }[] = [
    {
      value: 'all',
      label: 'All Events',
      description: 'Show all prediction data',
      color: 'bg-clinical-100 text-clinical-700'
    },
    {
      value: 'festival',
      label: 'Festival',
      description: 'Festival-related surge predictions',
      color: 'bg-yellow-100 text-yellow-700'
    },
    {
      value: 'pollution',
      label: 'Pollution',
      description: 'Air quality impact predictions',
      color: 'bg-red-100 text-red-700'
    },
    {
      value: 'epidemic',
      label: 'Epidemic',
      description: 'Disease outbreak predictions',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  const timeframeOptions: { value: Timeframe; label: string; description: string }[] = [
    {
      value: '24h',
      label: '24 Hours',
      description: 'Next day predictions'
    },
    {
      value: '72h',
      label: '72 Hours',
      description: 'Next 3 days'
    },
    {
      value: '7d',
      label: '7 Days',
      description: 'Weekly forecast'
    }
  ];

  const handleEventTypeChange = (eventType: EventType) => {
    onFilterChange({
      ...filters,
      eventType
    });
  };

  const handleTimeframeChange = (timeframe: Timeframe) => {
    onFilterChange({
      ...filters,
      timeframe
    });
  };

  return (
    <div className={cn('bg-white border border-clinical-200 rounded-2xl p-6 shadow-soft', className)}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Filter className="w-5 h-5 text-clinical-600" />
        <h3 className="text-lg font-semibold text-clinical-800">Prediction Filters</h3>
      </div>

      <div className="space-y-6">
        {/* Event Type Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Activity className="w-4 h-4 text-clinical-500" />
            <label className="text-sm font-medium text-clinical-700">Event Type</label>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {eventTypeOptions.map((option) => {
              const isSelected = filters.eventType === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleEventTypeChange(option.value)}
                  disabled={isLoading}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all duration-200',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected ? [
                      'border-blue-300 bg-blue-50',
                      option.color
                    ] : [
                      'border-clinical-200 bg-white hover:border-clinical-300',
                      'text-clinical-600 hover:text-clinical-800'
                    ]
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{option.label}</span>
                    {isSelected && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-xs opacity-75">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe Filter */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-clinical-500" />
            <label className="text-sm font-medium text-clinical-700">Timeframe</label>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {timeframeOptions.map((option) => {
              const isSelected = filters.timeframe === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleTimeframeChange(option.value)}
                  disabled={isLoading}
                  className={cn(
                    'px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200',
                    'hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSelected ? [
                      'border-blue-300 bg-blue-50 text-blue-700'
                    ] : [
                      'border-clinical-200 bg-white text-clinical-600',
                      'hover:border-clinical-300 hover:text-clinical-800'
                    ]
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span>{option.label}</span>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Timeframe descriptions */}
          <div className="mt-2">
            <p className="text-xs text-clinical-500">
              {timeframeOptions.find(opt => opt.value === filters.timeframe)?.description}
            </p>
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="pt-4 border-t border-clinical-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-clinical-600">
              <span className="font-medium">Active Filters:</span>
              <span className="ml-2">
                {eventTypeOptions.find(opt => opt.value === filters.eventType)?.label} • {filters.timeframe}
              </span>
            </div>
            
            {(filters.eventType !== 'all' || filters.timeframe !== '7d') && (
              <button
                onClick={() => onFilterChange({ eventType: 'all', timeframe: '7d' })}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center space-x-2 text-clinical-500">
              <div className="w-4 h-4 border-2 border-clinical-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="text-sm">Updating predictions...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterControls;