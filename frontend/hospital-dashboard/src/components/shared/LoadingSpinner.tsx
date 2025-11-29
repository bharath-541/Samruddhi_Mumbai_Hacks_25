import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Activity, Heart } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'medical' | 'pulse';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  text,
  className,
  fullScreen = false
}) => {
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      case 'xl': return 'w-12 h-12';
      default: return 'w-6 h-6';
    }
  };

  const getSpinnerIcon = () => {
    switch (variant) {
      case 'medical':
        return <Activity className={cn(getSizeClasses(size), 'animate-pulse text-blue-600')} />;
      case 'pulse':
        return <Heart className={cn(getSizeClasses(size), 'animate-pulse text-red-500')} />;
      default:
        return <Loader2 className={cn(getSizeClasses(size), 'animate-spin text-clinical-600')} />;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return 'text-xs';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-3',
      className
    )}>
      {getSpinnerIcon()}
      {text && (
        <p className={cn(
          'text-clinical-600 font-medium',
          getTextSize()
        )}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-soft border border-clinical-200 p-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;