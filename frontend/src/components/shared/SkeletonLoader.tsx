import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'chart' | 'avatar' | 'button';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number; // For text variant
  animated?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  width,
  height,
  className,
  lines = 1,
  animated = true
}) => {
  const baseClasses = cn(
    'bg-clinical-200 rounded',
    animated && 'animate-pulse',
    className
  );

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'rounded-2xl';
      case 'chart':
        return 'rounded-2xl';
      case 'avatar':
        return 'rounded-full';
      case 'button':
        return 'rounded-xl';
      default:
        return 'rounded';
    }
  };

  const getDefaultSize = () => {
    switch (variant) {
      case 'card':
        return { width: '100%', height: '200px' };
      case 'chart':
        return { width: '100%', height: '300px' };
      case 'avatar':
        return { width: '40px', height: '40px' };
      case 'button':
        return { width: '120px', height: '40px' };
      default:
        return { width: '100%', height: '20px' };
    }
  };

  const defaultSize = getDefaultSize();
  const style = {
    width: width || defaultSize.width,
    height: height || defaultSize.height
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, getVariantClasses())}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : style.width // Last line shorter
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, getVariantClasses())}
      style={style}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('card-clinical p-6 space-y-4', className)}>
    <SkeletonLoader variant="text" width="60%" height="24px" />
    <SkeletonLoader variant="text" lines={3} />
    <div className="flex space-x-2">
      <SkeletonLoader variant="button" width="80px" />
      <SkeletonLoader variant="button" width="80px" />
    </div>
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('card-clinical p-6 space-y-4', className)}>
    <div className="flex items-center space-x-3">
      <SkeletonLoader variant="avatar" width="24px" height="24px" />
      <SkeletonLoader variant="text" width="200px" height="24px" />
    </div>
    <SkeletonLoader variant="chart" height="300px" />
    <div className="flex justify-between">
      <SkeletonLoader variant="text" width="80px" />
      <SkeletonLoader variant="text" width="80px" />
      <SkeletonLoader variant="text" width="80px" />
    </div>
  </div>
);

export const SkeletonStats: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('card-clinical p-6 space-y-4', className)}>
    <SkeletonLoader variant="text" width="120px" height="16px" />
    <div className="flex items-baseline space-x-2">
      <SkeletonLoader variant="text" width="80px" height="36px" />
      <SkeletonLoader variant="text" width="40px" height="20px" />
    </div>
    <SkeletonLoader variant="text" width="100px" height="16px" />
  </div>
);

export default SkeletonLoader;