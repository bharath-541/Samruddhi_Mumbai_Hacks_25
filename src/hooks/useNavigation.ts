import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface UseNavigationReturn {
  activeTab: string;
  handleTabChange: (tab: string) => void;
  navigationHistory: string[];
  canGoBack: boolean;
  goBack: () => void;
}

export const useNavigation = (): UseNavigationReturn => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // Get current active tab from URL
  const getActiveTabFromPath = (pathname: string): string => {
    const path = pathname.replace('/', '');
    // Map dashboard to dashboard, otherwise use the path or default to dashboard
    if (path === 'dashboard') return 'dashboard';
    return path || 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(
    getActiveTabFromPath(location.pathname)
  );

  // Update active tab when location changes
  useEffect(() => {
    const newTab = getActiveTabFromPath(location.pathname);
    setActiveTab(newTab);
    
    // Add to navigation history
    setNavigationHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[newHistory.length - 1] !== newTab) {
        newHistory.push(newTab);
        // Keep only last 10 items in history
        return newHistory.slice(-10);
      }
      return newHistory;
    });
  }, [location.pathname]);

  // Handle tab changes with navigation
  const handleTabChange = (tab: string) => {
    if (tab !== activeTab) {
      navigate(`/${tab}`);
    }
  };

  // Navigation utilities
  const canGoBack = navigationHistory.length > 1;
  
  const goBack = () => {
    if (canGoBack) {
      const currentIndex = navigationHistory.length - 1;
      const previousTab = navigationHistory[currentIndex - 1];
      if (previousTab) {
        navigate(`/${previousTab}`);
      }
    }
  };

  return {
    activeTab,
    handleTabChange,
    navigationHistory,
    canGoBack,
    goBack
  };
};