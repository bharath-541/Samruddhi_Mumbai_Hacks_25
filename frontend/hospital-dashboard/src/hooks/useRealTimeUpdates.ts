import { useState, useEffect, useCallback, useRef } from 'react';

interface RealTimeConfig {
  interval: number; // in milliseconds
  enabled: boolean;
  onUpdate?: () => void;
  onError?: (error: Error) => void;
}

interface UseRealTimeUpdatesReturn {
  isActive: boolean;
  lastUpdate: Date | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  forceUpdate: () => void;
}

export const useRealTimeUpdates = (config: RealTimeConfig): UseRealTimeUpdatesReturn => {
  const [isActive, setIsActive] = useState(config.enabled);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const configRef = useRef(config);

  // Update config ref when config changes
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const executeUpdate = useCallback(() => {
    try {
      setLastUpdate(new Date());
      configRef.current.onUpdate?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      configRef.current.onError?.(err);
      console.error('Real-time update error:', err);
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsActive(true);
    executeUpdate(); // Execute immediately

    intervalRef.current = setInterval(() => {
      executeUpdate();
    }, configRef.current.interval);
  }, [executeUpdate]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  }, [isActive, start, stop]);

  const forceUpdate = useCallback(() => {
    executeUpdate();
  }, [executeUpdate]);

  // Start/stop based on enabled config
  useEffect(() => {
    if (config.enabled && !isActive) {
      start();
    } else if (!config.enabled && isActive) {
      stop();
    }
  }, [config.enabled, isActive, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Pause updates when page is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else if (config.enabled) {
        start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [config.enabled, start, stop]);

  return {
    isActive,
    lastUpdate,
    start,
    stop,
    toggle,
    forceUpdate
  };
};