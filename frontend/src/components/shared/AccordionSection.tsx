import React, { useState } from 'react';
import { Explanation, ExplanationDetail } from '@/types';
import { cn } from '@/lib/utils';
import { 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  TrendingUp,
  Database,
  Clock,
  Target,
  ExternalLink,
  Info
} from 'lucide-react';

interface AccordionSectionProps {
  explanation: Explanation;
  isInitiallyOpen?: boolean;
  className?: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  explanation,
  isInitiallyOpen = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(isInitiallyOpen);
  const { title, details, confidence, sources } = explanation;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'High Confidence';
    if (confidence >= 60) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getFactorIcon = (factor: string) => {
    const lowerFactor = factor.toLowerCase();
    if (lowerFactor.includes('air') || lowerFactor.includes('pollution')) {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    }
    if (lowerFactor.includes('historical') || lowerFactor.includes('pattern')) {
      return <Database className="w-4 h-4 text-blue-500" />;
    }
    if (lowerFactor.includes('weather') || lowerFactor.includes('condition')) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    return <Info className="w-4 h-4 text-clinical-500" />;
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      'bg-white border border-clinical-200 rounded-2xl shadow-soft overflow-hidden',
      className
    )}>
      {/* Header */}
      <button
        onClick={toggleOpen}
        className={cn(
          'w-full p-6 text-left transition-all duration-200',
          'hover:bg-clinical-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset',
          isOpen ? 'bg-clinical-50' : 'bg-white'
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6 text-clinical-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <div className={cn(
                  'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                  getConfidenceColor(confidence)
                )}>
                  <Target className="w-3 h-3" />
                  <span>{confidence}% - {getConfidenceLabel(confidence)}</span>
                </div>
                <span className="text-xs text-clinical-500">
                  {details.length} factor{details.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-xs text-clinical-500">
              {isOpen ? 'Collapse' : 'Expand'}
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-clinical-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-clinical-600" />
            )}
          </div>
        </div>
      </button>

      {/* Expandable Content */}
      <div className={cn(
        'transition-all duration-300 ease-in-out overflow-hidden',
        isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      )}>
        <div className="px-6 pb-6">
          {/* Explanation Details */}
          <div className="space-y-4">
            <div className="border-t border-clinical-100 pt-4">
              <h4 className="text-sm font-semibold text-clinical-700 mb-3">Contributing Factors</h4>
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div
                    key={index}
                    className="bg-clinical-50 border border-clinical-200 rounded-xl p-4"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getFactorIcon(detail.factor)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-clinical-800">
                            {detail.factor}
                          </h5>
                          {detail.change && (
                            <span className={cn(
                              'text-xs font-medium px-2 py-1 rounded-full',
                              detail.change.includes('↑') ? 'bg-red-100 text-red-700' :
                              detail.change.includes('↓') ? 'bg-green-100 text-green-700' :
                              'bg-clinical-100 text-clinical-700'
                            )}>
                              {detail.change}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-clinical-500">Current Value:</span>
                            <div className="font-medium text-clinical-800">{detail.value}</div>
                          </div>
                          <div>
                            <span className="text-clinical-500">Impact:</span>
                            <div className="font-medium text-clinical-800">{detail.impact}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Sources */}
            {sources.length > 0 && (
              <div className="border-t border-clinical-100 pt-4">
                <h4 className="text-sm font-semibold text-clinical-700 mb-3">Data Sources</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sources.map((source, index) => (
                    <div
                      key={index}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <h6 className="text-sm font-medium text-blue-800 truncate">
                              {source.name}
                            </h6>
                          </div>
                          <div className="flex items-center space-x-1 mt-1 text-xs text-blue-600">
                            <Clock className="w-3 h-3" />
                            <span>Updated: {formatTimestamp(source.lastUpdated)}</span>
                          </div>
                        </div>
                        
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="View source"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence Breakdown */}
            <div className="border-t border-clinical-100 pt-4">
              <h4 className="text-sm font-semibold text-clinical-700 mb-3">Confidence Analysis</h4>
              <div className="bg-clinical-50 border border-clinical-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-clinical-600">Overall Confidence</span>
                  <span className={cn(
                    'text-sm font-bold',
                    confidence >= 80 ? 'text-green-600' :
                    confidence >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  )}>
                    {confidence}%
                  </span>
                </div>
                
                {/* Confidence Bar */}
                <div className="w-full bg-clinical-200 rounded-full h-2 mb-3">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all duration-500',
                      confidence >= 80 ? 'bg-green-500' :
                      confidence >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    )}
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                
                <div className="text-xs text-clinical-500">
                  Based on {details.length} contributing factors and {sources.length} data sources
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccordionSection;