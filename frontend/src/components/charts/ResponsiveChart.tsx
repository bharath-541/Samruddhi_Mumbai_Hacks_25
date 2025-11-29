import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveChartProps {
  children: React.ReactNode;
  mobileHeight?: number;
  tabletHeight?: number;
  desktopHeight?: number;
  className?: string;
}

const ResponsiveChart: React.FC<ResponsiveChartProps> = ({
  children,
  mobileHeight = 300,
  tabletHeight = 400,
  desktopHeight = 450,
  className
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const getHeight = () => {
    if (isMobile) return mobileHeight;
    if (isTablet) return tabletHeight;
    return desktopHeight;
  };

  return (
    <div className={className} style={{ height: getHeight() }}>
      {React.isValidElement(children) 
        ? React.cloneElement(children, { height: getHeight() } as any)
        : children
      }
    </div>
  );
};

export default ResponsiveChart;