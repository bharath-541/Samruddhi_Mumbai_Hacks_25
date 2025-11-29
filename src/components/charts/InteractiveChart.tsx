import React, { useState } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar
} from 'recharts';
import { ChartDataPoint, EventType } from '@/types';
import { cn } from '@/lib/utils';
import { TrendingUp, BarChart3, Activity, AlertTriangle } from 'lucide-react';

interface InteractiveChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  chartType?: 'line' | 'heatmap' | 'combined';
  isLoading?: boolean;
  error?: string;
  className?: string;
  onDataPointClick?: (dataPoint: ChartDataPoint) => void;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({
  data,
  title,
  height = 400,
  chartType = 'line',
  isLoading = false,
  error,
  className,
  onDataPointClick
}) => {
  const [activeDataPoint, setActiveDataPoint] = useState<ChartDataPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  // Enhanced tooltip with more details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-clinical-200 rounded-xl shadow-lg max-w-xs">
          <div className="border-b border-clinical-100 pb-2 mb-3">
            <p className="text-sm font-semibold text-clinical-800">
              {new Date(label).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-clinical-600">Predicted Patients:</span>
              <span className="text-sm font-bold text-blue-600">{payload[0].value}</span>
            </div>
            
            {data.confidence && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-clinical-600">Confidence:</span>
                <span className="text-sm font-medium text-green-600">{data.confidence}%</span>
              </div>
            )}
            
            {data.eventType && (
              <div className="mt-3 pt-2 border-t border-clinical-100">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-yellow-700 capitalize">
                    {data.eventType} Event
                  </span>
                </div>
                <p className="text-xs text-clinical-500 mt-1">
                  {getEventDescription(data.eventType)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getEventDescription = (eventType: EventType) => {
    switch (eventType) {
      case 'festival':
        return 'Increased cases expected due to festival celebrations';
      case 'pollution':
        return 'Air quality deterioration may increase respiratory cases';
      case 'epidemic':
        return 'Disease outbreak pattern detected';
      default:
        return 'Special event predicted';
    }
  };

  // Handle chart interactions
  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const clickedPoint = data.activePayload[0].payload;
      setActiveDataPoint(clickedPoint);
      onDataPointClick?.(clickedPoint);
    }
  };

  const handleMouseEnter = (data: any) => {
    if (data) {
      setHoveredPoint(data);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Get color based on event type
  const getEventColor = (eventType?: EventType) => {
    switch (eventType) {
      case 'festival':
        return '#f59e0b'; // yellow
      case 'pollution':
        return '#ef4444'; // red
      case 'epidemic':
        return '#8b5cf6'; // purple
      default:
        return '#3b82f6'; // blue
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('bg-white border border-clinical-200 rounded-2xl p-6 shadow-soft', className)}>
        {title && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-6 bg-clinical-200 rounded w-48 animate-pulse"></div>
          </div>
        )}
        <div className="animate-pulse">
          <div className={`bg-clinical-100 rounded-lg`} style={{ height }}></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('bg-white border border-red-200 rounded-2xl p-6 shadow-soft', className)}>
        {title && (
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-clinical-600" />
            <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
          </div>
        )}
        <div className="flex items-center justify-center text-red-600" style={{ height }}>
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-sm font-medium">Failed to load prediction data</p>
            <p className="text-xs text-clinical-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <div className={cn('bg-white border border-clinical-200 rounded-2xl p-6 shadow-soft', className)}>
        {title && (
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-clinical-600" />
            <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
          </div>
        )}
        <div className="flex items-center justify-center text-clinical-500" style={{ height }}>
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No prediction data available</p>
            <p className="text-xs mt-1">Adjust filters to view predictions</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
  const avgConfidence = data.reduce((sum, d) => sum + (d.confidence || 0), 0) / data.length;

  return (
    <div className={cn('card-clinical p-6', className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-clinical-600" />
            <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
          </div>
          <div className="flex items-center space-x-4 text-xs text-clinical-500">
            <span>Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
            <span>Points: {data.length}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ width: '100%', height }} className="mb-4">
        <ResponsiveContainer>
          {chartType === 'combined' ? (
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              <Bar 
                dataKey="confidence" 
                fill="#10b981" 
                opacity={0.3}
                name="Confidence %"
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                activeDot={{ 
                  r: 8, 
                  stroke: '#3b82f6', 
                  strokeWidth: 2, 
                  fill: '#ffffff',
                  onClick: handleChartClick
                }}
                name="Predicted Patients"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />
            </ComposedChart>
          ) : (
            <RechartsLineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  });
                }}
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />

              {/* Reference lines */}
              <ReferenceLine 
                y={avgValue} 
                stroke="#94a3b8" 
                strokeDasharray="5 5" 
                opacity={0.7}
                label={{ value: "Average", position: "top", fontSize: 12 }}
              />

              {/* Main prediction line */}
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.eventType ? 6 : 4}
                      fill={getEventColor(payload.eventType)}
                      stroke="#ffffff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                    />
                  );
                }}
                activeDot={{ 
                  r: 8, 
                  stroke: '#3b82f6', 
                  strokeWidth: 2, 
                  fill: '#ffffff',
                  style: { cursor: 'pointer' }
                }}
                name="Predicted Patients"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              />

              {/* Confidence area if available */}
              {data.some(d => d.confidence) && (
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Confidence %"
                />
              )}
            </RechartsLineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-clinical-100">
        <div className="text-center">
          <div className="text-lg font-bold text-clinical-800">{Math.round(maxValue)}</div>
          <div className="text-xs text-clinical-500">Peak</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-clinical-800">{Math.round(minValue)}</div>
          <div className="text-xs text-clinical-500">Minimum</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-clinical-800">{Math.round(avgValue)}</div>
          <div className="text-xs text-clinical-500">Average</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-clinical-800">{Math.round(avgConfidence)}%</div>
          <div className="text-xs text-clinical-500">Avg Confidence</div>
        </div>
      </div>

      {/* Active Data Point Details */}
      {activeDataPoint && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">Selected Point:</span>
            <button 
              onClick={() => setActiveDataPoint(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
          <div className="mt-2 text-sm text-blue-700">
            {new Date(activeDataPoint.date).toLocaleDateString()} - {activeDataPoint.value} patients
            {activeDataPoint.confidence && ` (${activeDataPoint.confidence}% confidence)`}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveChart;