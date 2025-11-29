import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/overview');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Error Icon */}
        <div className="mb-8">
          <AlertTriangle className="w-24 h-24 text-clinical-400 mx-auto" />
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold text-clinical-800 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-clinical-700 mb-4">Page Not Found</h2>
        <p className="text-clinical-600 mb-8 leading-relaxed">
          The page you're looking for doesn't exist or has been moved. 
          Please check the URL or navigate back to the dashboard.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoHome}
            className={cn(
              'flex items-center justify-center space-x-2 px-6 py-3 rounded-xl',
              'bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>

          <button
            onClick={handleGoBack}
            className={cn(
              'flex items-center justify-center space-x-2 px-6 py-3 rounded-xl',
              'bg-clinical-100 text-clinical-700 font-medium hover:bg-clinical-200 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-clinical-500 focus:ring-offset-2'
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-8 border-t border-clinical-200">
          <p className="text-sm text-clinical-500">
            If you believe this is an error, please contact the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;