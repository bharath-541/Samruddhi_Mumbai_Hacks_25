import React, { useState, useEffect } from 'react';
import { Recommendation, RecommendationCategory } from '@/types';
import { useRecommendations } from '@/hooks/useRecommendations';
import RecommendationCard from '@/components/shared/RecommendationCard';
import MobileOptimizedGrid from '@/components/shared/MobileOptimizedGrid';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  Users, 
  Package, 
  MessageSquare, 
  Filter,
  RefreshCw,
  BarChart3,
  AlertTriangle,
  Clock
} from 'lucide-react';

const Recommendations: React.FC = () => {
  const {
    recommendations,
    isLoading,
    error,
    handleRecommendationAction,
    refreshRecommendations,
    getRecommendationsByCategory,
    getRecommendationStats
  } = useRecommendations();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const { isMobile } = useResponsive();

  const categoryOptions = [
    {
      id: 'all',
      label: 'All Recommendations',
      icon: <Filter className="w-4 h-4" />,
      description: 'View all recommendations'
    },
    {
      id: 'staffing',
      label: 'Staffing',
      icon: <Users className="w-4 h-4" />,
      description: 'Staff allocation and scheduling'
    },
    {
      id: 'supplies',
      label: 'Supplies',
      icon: <Package className="w-4 h-4" />,
      description: 'Equipment and supply orders'
    },
    {
      id: 'advisory',
      label: 'Advisory',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Patient communications'
    }
  ];

  const filteredRecommendations = getRecommendationsByCategory(activeCategory);
  const stats = getRecommendationStats();

  // Get top 3 recommendations for mobile compact view
  const getTopRecommendations = (recs: Recommendation[]): Recommendation[] => {
    return recs
      .filter(rec => rec.status === 'pending')
      .sort((a, b) => {
        // Sort by priority (high > medium > low) then by creation date
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, 3);
  };

  const displayRecommendations = isMobile ? 
    getTopRecommendations(filteredRecommendations) : 
    filteredRecommendations;

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
  };

  const handleRefresh = async () => {
    await refreshRecommendations();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">AI Recommendations</h1>
          <p className="text-gray-600 mt-1">
            {isMobile ? 'Top 3 priority recommendations' : 'Staffing, supplies, and patient advisory suggestions'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-200',
              'bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-soft-blue-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <BarChart3 className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</div>
        </div>
        
        <div className="bg-gradient-to-br from-soft-yellow-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.pending}</div>
        </div>
        
        <div className="bg-gradient-to-br from-soft-green-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <CheckCircle className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Accepted</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">{stats.accepted}</div>
        </div>
        
        <div className="bg-gradient-to-br from-soft-purple-50 to-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">Other</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {stats.dismissed + stats.modified}
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-soft-beige-100 rounded-lg">
            <Filter className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Filter by Category</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryOptions.map((option) => {
            const isActive = activeCategory === option.id;
            const categoryCount = option.id === 'all' ? 
              recommendations.length : 
              recommendations.filter(rec => rec.category === option.id).length;
            
            return (
              <button
                key={option.id}
                onClick={() => handleCategoryChange(option.id)}
                disabled={isLoading}
                className={cn(
                  'p-4 rounded-lg border text-left transition-all duration-200',
                  'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isActive ? [
                    'border-gray-300 bg-white text-gray-900 shadow-sm'
                  ] : [
                    'border-gray-200 bg-white text-gray-600',
                    'hover:border-gray-300'
                  ]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {option.icon}
                    <span className="font-semibold text-sm">{option.label}</span>
                  </div>
                  <div className={cn(
                    'text-xs font-bold px-2 py-1 rounded-full',
                    isActive ? 'bg-gray-100 text-gray-900' : 'bg-gray-50 text-gray-600'
                  )}>
                    {categoryCount}
                  </div>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            );
          })}
        </div>

        {/* Active Filter Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              <span className="font-medium">Showing:</span>
              <span className="ml-2">
                {categoryOptions.find(opt => opt.id === activeCategory)?.label} 
                ({filteredRecommendations.length} items)
              </span>
              {isMobile && filteredRecommendations.length > 3 && (
                <span className="text-gray-500 ml-2">
                  • Top 3 displayed on mobile
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Recommendations</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : displayRecommendations.length === 0 ? (
        <div className="bg-clinical-50 border border-clinical-200 rounded-2xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-clinical-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-clinical-700 mb-2">
            {isLoading ? 'Loading Recommendations...' : 'No Recommendations Found'}
          </h3>
          <p className="text-clinical-500">
            {isLoading 
              ? 'Please wait while we load your recommendations'
              : activeCategory === 'all' 
                ? 'All recommendations have been processed'
                : `No ${activeCategory} recommendations available`
            }
          </p>
        </div>
      ) : (
        <MobileOptimizedGrid
          mobileColumns={1}
          tabletColumns={2}
          desktopColumns={3}
          gap="md"
          maxItems={isMobile ? 3 : undefined}
        >
          {displayRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onAction={handleRecommendationAction}
              isLoading={isLoading}
            />
          ))}
        </MobileOptimizedGrid>
      )}

      {/* Mobile View Notice */}
      {isMobile && filteredRecommendations.length > 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
          <div className="text-sm text-blue-700">
            <span className="font-medium">Mobile View:</span>
            <span className="ml-2">
              Showing top 3 of {filteredRecommendations.length} recommendations. 
              Switch to desktop for full view.
            </span>
          </div>
        </div>
      )}

      {/* Footer Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            <span className="font-medium">Summary:</span>
            <span className="ml-2">
              {stats.pending} pending • {stats.accepted} accepted • {stats.dismissed + stats.modified} processed
            </span>
          </div>
          <div className="text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations;