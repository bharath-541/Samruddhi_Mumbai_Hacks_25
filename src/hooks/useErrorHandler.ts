import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string | null;
}

interface UseErrorHandlerReturn {
  error: ErrorState;
  setError: (error: Error | string | null) => void;
  clearError: () => void;
  handleAsyncError: <T>(asyncFn: () => Promise<T>) => Promise<T | null>;
  withErrorHandling: <T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => (...args: T) => Promise<R | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: null
  });

  const setError = useCallback((errorInput: Error | string | null) => {
    if (!errorInput) {
      setErrorState({
        hasError: false,
        error: null,
        errorMessage: null
      });
      return;
    }

    const errorObj = errorInput instanceof Error ? errorInput : new Error(errorInput);
    const errorMessage = errorInput instanceof Error ? errorInput.message : errorInput;

    setErrorState({
      hasError: true,
      error: errorObj,
      errorMessage
    });

    // Log error for debugging
    console.error('Error handled:', errorObj);
  }, []);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorMessage: null
    });
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      clearError();
      return await asyncFn();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    }
  }, [setError, clearError]);

  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => R | Promise<R>
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        clearError();
        const result = await fn(...args);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return null;
      }
    };
  }, [setError, clearError]);

  return {
    error,
    setError,
    clearError,
    handleAsyncError,
    withErrorHandling
  };
};