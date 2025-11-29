import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface MobileOptimizedGridProps {
  children: React.ReactNode;
  className?: string;
  mobileColumns?: 1 | 2;
  tabletColumns?: 1 | 2 | 3 | 4;
  desktopColumns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  maxItems?: number; // Limit items on mobile
}

const MobileOptimizedGrid: React.FC<MobileOptimizedGridProps> = ({
  children,
  className,
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 'md',
  maxItems
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Convert children to array for manipulation
  const childrenArray = React.Children.toArray(children);
  
  // Limit items on mobile if specified
  const displayChildren = maxItems && isMobile 
    ? childrenArray.slice(0, maxItems)
    : childrenArray;

  // Get grid column classes
  const getGridCols = () => {
    if (isMobile) {
      return mobileColumns === 1 ? 'grid-cols-1' : 'grid-cols-2';
    }
    if (isTablet) {
      return `grid-cols-${tabletColumns}`;
    }
    return `grid-cols-${desktopColumns}`;
  };

  // Get gap classes
  const getGapClass = () => {
    switch (gap) {
      case 'sm': return 'gap-3';
      case 'lg': return 'gap-8';
      default: return 'gap-6';
    }
  };

  return (
    <div className={cn(
      'grid',
      getGridCols(),
      getGapClass(),
      className
    )}>
      {displayChildren}
      
      {/* Show truncation notice on mobile if items were limited */}
      {maxItems && isMobile && childrenArray.length > maxItems && (
        <div className="col-span-full">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Mobile View:</span>
              <span className="ml-2">
                Showing {maxItems} of {childrenArray.length} items. 
                Switch to desktop for full view.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedGrid;