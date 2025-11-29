import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';

interface TouchOptimizedProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'button' | 'card' | 'link';
}

const TouchOptimized: React.FC<TouchOptimizedProps> = ({
  children,
  className,
  as: Component = 'div',
  onClick,
  disabled = false,
  variant = 'button'
}) => {
  const { isMobile } = useResponsive();

  // Base touch-optimized styles
  const touchStyles = {
    button: cn(
      // Minimum touch target size (44px)
      'min-h-[44px] min-w-[44px]',
      // Enhanced padding for touch
      isMobile ? 'px-6 py-3' : 'px-4 py-2',
      // Touch feedback
      'active:scale-95 transition-transform duration-150',
      // Focus styles for accessibility
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    ),
    card: cn(
      // Touch-friendly spacing
      isMobile ? 'p-6' : 'p-4',
      // Touch feedback
      onClick && 'active:scale-[0.98] transition-transform duration-150',
      // Cursor indication
      onClick && !disabled && 'cursor-pointer',
      // Focus styles
      onClick && 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    ),
    link: cn(
      // Enhanced touch target
      isMobile ? 'py-3 px-2' : 'py-1 px-1',
      // Touch feedback
      'active:opacity-70 transition-opacity duration-150',
      // Focus styles
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded',
      // Disabled state
      disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
    )
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!disabled && onClick && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onClick();
    }
  };

  return React.createElement(
    Component,
    {
      className: cn(touchStyles[variant], className),
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      tabIndex: onClick && !disabled ? 0 : undefined,
      role: onClick ? 'button' : undefined,
      'aria-disabled': disabled
    },
    children
  );
};

export default TouchOptimized;