import { useState, useEffect } from 'react';
import { Recommendation, RecommendationStatus } from '@/types';
import { dataService } from '@/services/dataService';

interface UseRecommendationsReturn {
  recommendations: Recommendation[];
  isLoading: boolean;
  error: string | null;
  handleRecommendationAction: (id: string, action: 'accept' | 'modify' | 'dismiss') => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  getRecommendationsByCategory: (category?: string) => Recommendation[];
  getRecommendationStats: () => {
    total: number;
    pending: number;
    accepted: number;
    dismissed: number;
    modified: number;
  };
}

export const useRecommendations = (): UseRecommendationsReturn => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const data = await dataService.getRecommendations();
      setRecommendations(data);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error('Error loading recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecommendationAction = async (
    id: string,
    action: 'accept' | 'modify' | 'dismiss'
  ): Promise<void> => {
    try {
      // Add to loading set
      setActionLoading(prev => new Set(prev).add(id));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update recommendation status
      setRecommendations(prev =>
        prev.map(rec => {
          if (rec.id === id) {
            const newStatus: RecommendationStatus =
              action === 'accept' ? 'accepted' :
                action === 'modify' ? 'modified' :
                  'dismissed';

            return {
              ...rec,
              status: newStatus
            };
          }
          return rec;
        })
      );

      // Show success feedback (could be replaced with toast notification)
      console.log(`Recommendation ${id} ${action}ed successfully`);

    } catch (err) {
      setError(`Failed to ${action} recommendation`);
      console.error(`Error ${action}ing recommendation:`, err);
    } finally {
      // Remove from loading set
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const refreshRecommendations = async (): Promise<void> => {
    await loadRecommendations();
  };

  const getRecommendationsByCategory = (category?: string): Recommendation[] => {
    if (!category || category === 'all') {
      return recommendations;
    }
    return recommendations.filter(rec => rec.category === category);
  };

  const getRecommendationStats = () => {
    const stats = {
      total: recommendations.length,
      pending: 0,
      accepted: 0,
      dismissed: 0,
      modified: 0
    };

    recommendations.forEach(rec => {
      switch (rec.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'accepted':
          stats.accepted++;
          break;
        case 'dismissed':
          stats.dismissed++;
          break;
        case 'modified':
          stats.modified++;
          break;
      }
    });

    return stats;
  };

  return {
    recommendations,
    isLoading: isLoading || actionLoading.size > 0,
    error,
    handleRecommendationAction,
    refreshRecommendations,
    getRecommendationsByCategory,
    getRecommendationStats
  };
};