import React from 'react';
import { cn } from '@/lib/utils';

interface ClinicalTextProps {
  children: React.ReactNode;
  variant?: 'heading' | 'subheading' | 'body' | 'caption' | 'data' | 'label';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error';
  className?: string;
  as?: React.ElementType;
}

const ClinicalText: React.FC<ClinicalTextProps> = ({
  children,
  variant = 'body',
  size,
  weight,
  color = 'primary',
  className,
  as
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'heading':
        return 'text-clinical-2xl font-semibold text-clinical-800 leading-tight';
      case 'subheading':
        return 'text-clinical-lg font-medium text-clinical-700 leading-relaxed';
      case 'body':
        return 'text-clinical-base text-clinical-700 leading-relaxed';
      case 'caption':
        return 'text-clinical-sm text-clinical-600 leading-normal';
      case 'data':
        return 'font-medical-data text-clinical-base text-clinical-800 font-medium';
      case 'label':
        return 'text-clinical-sm font-medium text-clinical-700 uppercase tracking-wide';
      default:
        return 'text-clinical-base text-clinical-700';
    }
  };

  const getSizeStyles = (size?: string) => {
    if (!size) return '';
    return `text-clinical-${size}`;
  };

  const getWeightStyles = (weight?: string) => {
    switch (weight) {
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      default: return '';
    }
  };

  const getColorStyles = (color: string) => {
    switch (color) {
      case 'primary':
        return 'text-clinical-800';
      case 'secondary':
        return 'text-clinical-700';
      case 'muted':
        return 'text-clinical-600';
      case 'success':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
      default:
        return 'text-clinical-800';
    }
  };

  const Component = as || 'span';

  return (
    <Component className={cn(
      getVariantStyles(variant),
      getSizeStyles(size),
      getWeightStyles(weight),
      getColorStyles(color),
      className
    )}>
      {children}
    </Component>
  );
};

export default ClinicalText;