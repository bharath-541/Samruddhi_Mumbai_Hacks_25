import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  // Define route labels
  const routeLabels: Record<string, string> = {
    overview: 'Hospital Overview',
    predictions: 'Prediction Analytics',
    recommendations: 'AI Recommendations',
    explainability: 'AI Explainability'
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Always start with home
    breadcrumbs.push({
      label: 'Dashboard',
      path: '/overview',
      isActive: pathSegments.length === 0 || pathSegments[0] === 'overview'
    });

    // Add current page if not overview
    if (pathSegments.length > 0 && pathSegments[0] !== 'overview') {
      const currentSegment = pathSegments[0];
      breadcrumbs.push({
        label: routeLabels[currentSegment] || currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1),
        path: `/${currentSegment}`,
        isActive: true
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs if only one item (home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-clinical-600 mb-4" aria-label="Breadcrumb">
      <Home className="w-4 h-4" />
      
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-clinical-400" />
          )}
          
          {item.isActive ? (
            <span className="font-medium text-clinical-800" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.path}
              className={cn(
                'hover:text-clinical-800 transition-colors',
                'focus:outline-none focus:underline'
              )}
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;