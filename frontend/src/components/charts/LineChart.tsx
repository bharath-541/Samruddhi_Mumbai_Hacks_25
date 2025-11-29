import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { ChartDataPoint } from '@/types';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface LineChartProps {
  data: ChartDataPoint[];
  title?: string;
  height?: number;
  showConfidence?: boolean;
  showLegend?: boolean;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  height = 300,
  showConfidence = false,
  showLegend = true,
  isLoading = false,
  error,
  className
}) => {
  const { isMobile } = useResponsive();
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-clinical-200 rounded-lg shadow-soft">
          <p className="text-sm font-medium text-clinical-800 mb-2">
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })}
          </p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-clinical-600">
                Predicted: <span className="font-medium">{payload[0].value}</span> patients
              </span>
            </div>
            {showConfidence && data.confidence && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-clinical-600">
                  Confidence: <span className="font-medium">{data.confidence}%</span>
                </span>
              </div>
            )}
            {data.eventType && (
              <div className="flex items-center space-x-2 mt-2 pt-2 border-t border-clinical-100">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-xs text-yellow-700 capitalize">
                  {data.eventType} event predicted
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className={cn('bg-white border border-clinical-200 rounded-2xl p-6 shadow-soft', className)}>
        {title && (
          <div className="flex items-center space-x-2 mb-4">
            <div className="h-5 bg-clinical-200 rounded w-32 animate-pulse"></div>
          </div>
        )}
        <div className="animate-pulse">
          <div className="h-64 bg-clinical-100 rounded-lg"></div>
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
        <div className="flex items-center justify-center h-64 text-red-600">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-sm font-medium">Failed to load chart data</p>
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
        <div className="flex items-center justify-center h-64 text-clinical-500">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No data available</p>
            <p className="text-xs mt-1">Chart will appear when data is loaded</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate average for reference line
  const average = data.reduce((sum, item) => sum + item.value, 0) / data.length;

  return (
    <div className={cn('card-clinical p-6', className)}>
      {title && (
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-clinical-600" />
          <h3 className="text-lg font-semibold text-clinical-800">{title}</h3>
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <RechartsLineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e2e8f0" 
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  month: isMobile ? 'numeric' : 'short', 
                  day: 'numeric' 
                });
              }}
              stroke="#64748b"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? 1 : 0}
            />
            <YAxis
              stroke="#64748b"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => isMobile ? `${value}` : `${value}`}
              width={isMobile ? 40 : 60}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {showLegend && (
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            )}

            {/* Reference line for average */}
            <ReferenceLine 
              y={average} 
              stroke="#94a3b8" 
              strokeDasharray="5 5" 
              opacity={0.7}
              label={{ value: "Average", position: "top", fontSize: 12 }}
            />

            {/* Main data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
              name="Predicted Patients"
            />

            {/* Confidence line if enabled */}
            {showConfidence && (
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
        </ResponsiveContainer>
      </div>

      {/* Chart footer with insights */}
      <div className="mt-4 pt-4 border-t border-clinical-100">
        <div className="flex items-center justify-between text-xs text-clinical-500">
          <div className="flex items-center space-x-4">
            <span>Avg: {Math.round(average)} patients</span>
            <span>Peak: {Math.max(...data.map(d => d.value))} patients</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Real-time predictions</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LineChart;