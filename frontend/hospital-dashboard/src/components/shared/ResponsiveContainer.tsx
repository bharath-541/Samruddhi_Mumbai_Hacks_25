import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
  showOnlyMobile?: boolean;
  showOnlyTablet?: boolean;
  showOnlyDesktop?: boolean;
}

const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className,
  mobileClassName,
  tabletClassName,
  desktopClassName,
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  showOnlyMobile = false,
  showOnlyTablet = false,
  showOnlyDesktop = false
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  // Determine if component should be hidden
  const shouldHide = 
    (hideOnMobile && isMobile) ||
    (hideOnTablet && isTablet) ||
    (hideOnDesktop && isDesktop) ||
    (showOnlyMobile && !isMobile) ||
    (showOnlyTablet && !isTablet) ||
    (showOnlyDesktop && !isDesktop);

  if (shouldHide) {
    return null;
  }

  // Build responsive class names
  const responsiveClassName = cn(
    className,
    isMobile && mobileClassName,
    isTablet && tabletClassName,
    isDesktop && desktopClassName
  );

  return (
    <div className={responsiveClassName}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;