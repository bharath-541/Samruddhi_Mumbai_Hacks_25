import React, { useState, useEffect } from 'react';
import { HospitalMetrics } from '@/types';
import { dataService } from '@/services/dataService';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Users,
  Bed,
  Heart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  RefreshCw,
  Phone,
  Stethoscope,
  Ambulance,
  Building2,
  Zap,
  Brain,
  ChevronRight,
  Clock,
  Info,
  UserX,
  Bell,
  Download,
  Upload,
  FileClock,
  Award,
  ArrowRight,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Overview: React.FC = () => {
  const [metrics, setMetrics] = useState<HospitalMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showNotifications, setShowNotifications] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const hospitalMetrics = await dataService.getHospitalMetrics();
      setMetrics(hospitalMetrics);
      setLastUpdated(new Date());
      setIsLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    const hospitalMetrics = await dataService.getHospitalMetrics();
    setMetrics(hospitalMetrics);
    setLastUpdated(new Date());
  };

  // Generate smart KPI data with comparisons
  const getSmartKPIs = () => {
    if (!metrics) return [];

    const currentBeds = Math.round(metrics.bedOccupancy * 2.5); // Current occupied beds
    const totalBeds = 250;
    const optimalBeds = Math.round(totalBeds * 0.85); // 85% is optimal

    const currentICU = Math.round(metrics.icuUsage * 0.24);
    const totalICU = 24;
    const maxSafeICU = Math.round(totalICU * 0.75); // 75% is max safe capacity

    const currentStaff = Math.round(metrics.staffAvailability * 1.45);
    const totalStaff = 145;
    const requiredStaff = Math.round(totalStaff * 0.90); // 90% required for optimal care

    return [
      {
        title: 'Bed Occupancy',
        current: currentBeds,
        total: totalBeds,
        optimal: optimalBeds,
        unit: 'beds',
        percentage: metrics.bedOccupancy,
        trend: 8,
        icon: <Bed className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-blue-500 to-cyan-600',
        description: `${currentBeds} occupied of ${totalBeds} total`,
        status: metrics.bedOccupancy > 85 ? 'warning' : 'good',
        comparison: `${optimalBeds} beds optimal`
      },
      {
        title: 'ICU Capacity',
        current: currentICU,
        total: totalICU,
        optimal: maxSafeICU,
        unit: 'beds',
        percentage: metrics.icuUsage,
        trend: -2,
        icon: <Heart className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-teal-500 to-emerald-600',
        description: `${currentICU} occupied of ${totalICU} available`,
        status: metrics.icuUsage > 75 ? 'warning' : 'good',
        comparison: `Max safe: ${maxSafeICU} beds`
      },
      {
        title: 'Staff Availability',
        current: currentStaff,
        total: totalStaff,
        optimal: requiredStaff,
        unit: 'staff',
        percentage: metrics.staffAvailability,
        trend: 5,
        icon: <Users className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-green-500 to-teal-600',
        description: `${currentStaff} available of ${totalStaff} total`,
        status: metrics.staffAvailability > 90 ? 'excellent' : 'good',
        comparison: `${requiredStaff} staff required`
      },
      {
        title: 'Equipment Status',
        current: 142,
        total: 150,
        optimal: 135,
        unit: 'devices',
        percentage: 95,
        trend: 3,
        icon: <Activity className="w-6 h-6" />,
        color: 'bg-gradient-to-r from-cyan-500 to-blue-600',
        description: '142 operational of 150 total',
        status: 'excellent',
        comparison: '135 devices minimum required'
      }
    ];
  };

  // Generate horizontal performance metrics
  const getPerformanceMetrics = () => {
    if (!metrics) return [];

    return [
      {
        label: 'Emergency Response Time',
        value: 87,
        target: 95,
        color: 'bg-orange-500',
        status: 'improving'
      },
      {
        label: 'Staff Productivity',
        value: 92,
        target: 90,
        color: 'bg-green-500',
        status: 'excellent'
      },
      {
        label: 'Equipment Uptime',
        value: 98,
        target: 95,
        color: 'bg-blue-500',
        status: 'excellent'
      },
      {
        label: 'Patient Flow Efficiency',
        value: 85,
        target: 88,
        color: 'bg-teal-500',
        status: 'good'
      }
    ];
  };

  // Generate AI insights
  const getAIInsights = () => {
    return [
      {
        id: '1',
        type: 'recommendation',
        title: 'Optimize ICU Allocation',
        description: 'AI suggests reallocating 3 ICU beds to general ward during 2-4 PM for 15% efficiency gain.',
        impact: 'High',
        confidence: 94,
        icon: <Lightbulb className="w-5 h-5" />
      },
      {
        id: '2',
        type: 'prediction',
        title: 'Patient Surge Expected',
        description: 'Predictive model forecasts 23% increase in patient admissions this weekend.',
        impact: 'Medium',
        confidence: 87,
        icon: <TrendingUp className="w-5 h-5" />
      },
      {
        id: '3',
        type: 'alert',
        title: 'Resource Optimization',
        description: 'Smart scheduling can reduce staff overtime by 18% without affecting patient care.',
        impact: 'High',
        confidence: 91,
        icon: <Zap className="w-5 h-5" />
      }
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-16 bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-3xl"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Hospital Operations Control Center */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-soft-blue-100 rounded-lg">
              <Building2 className="w-8 h-8 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Hospital Operations</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse"></div>
                Live • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-soft-blue-50 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-soft-blue-100 transition-colors border border-gray-200 shadow-sm">
              <Upload className="w-4 h-4" />
              Import Data
            </button>
            <button className="px-4 py-2 bg-soft-green-50 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-soft-green-100 transition-colors border border-gray-200 shadow-sm">
              <Download className="w-4 h-4" />
              Export Report
            </button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors border border-gray-200 shadow-sm">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Real-time Operations Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Bed Occupancy',
              value: `${metrics?.occupiedBeds ?? Math.round((metrics?.bedOccupancy || 0) * 0.6)}/${metrics?.totalBeds ?? 60}`,
              percentage: metrics?.bedOccupancy || 0,
              status: 'warning',
              icon: <Bed className="w-5 h-5" />,
              bgColor: 'from-soft-blue-50 to-white',
              trend: '+8%',
              action: 'View Beds'
            },
            {
              title: 'ICU Capacity',
              value: `${Math.round((metrics?.icuUsage || 0) * 0.09)}/9`,
              percentage: metrics?.icuUsage || 0,
              status: 'warning',
              icon: <Heart className="w-5 h-5" />,
              bgColor: 'from-soft-pink-50 to-white',
              trend: '+2%',
              action: 'Manage ICU'
            },
            {
              title: 'Staff on Duty',
              value: `${metrics?.onDutyDoctors ?? Math.round((metrics?.staffAvailability || 0) * 0.12)}/${metrics?.totalDoctors ?? 12}`,
              percentage: metrics?.staffAvailability || 0,
              status: 'excellent',
              icon: <Users className="w-5 h-5" />,
              bgColor: 'from-soft-green-50 to-white',
              trend: '+5%',
              action: 'View Staff'
            },
            {
              title: 'Equipment Status',
              value: '142/150',
              percentage: 95,
              status: 'excellent',
              icon: <Activity className="w-5 h-5" />,
              bgColor: 'from-soft-teal-50 to-white',
              trend: '+3%',
              action: 'Check Equipment'
            }
          ].map((item, index) => (
            <div key={index} className={cn("bg-gradient-to-br rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all", item.bgColor)}>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-600">{item.icon}</div>
                </div>
                <span className="text-xs px-2 py-1 rounded font-medium bg-white shadow-sm text-gray-700">
                  {item.percentage}%
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                <span className="text-sm text-gray-600 font-medium">{item.trend}</span>
              </div>
              <button className="w-full text-sm text-gray-600 hover:text-gray-900 font-medium">
                {item.action}
              </button>
            </div>
          ))}
        </div>

        {/* Emergency Contacts & Quick Actions */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-bold text-red-900">Emergency Response Center</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-700 font-medium">24/7 Active</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center gap-3 bg-white p-4 rounded-lg hover:bg-red-50 transition-colors">
              <Phone className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Emergency Line</div>
                <div className="text-sm text-gray-600">Call: 108</div>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white p-4 rounded-lg hover:bg-red-50 transition-colors">
              <Ambulance className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">Ambulance Dispatch</div>
                <div className="text-sm text-gray-600">3 units available</div>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white p-4 rounded-lg hover:bg-red-50 transition-colors">
              <Stethoscope className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <div className="font-semibold text-gray-900">On-Call Doctor</div>
                <div className="text-sm text-gray-600">Dr. Sharma available</div>
              </div>
            </button>
          </div>
        </div>

        {/* Hospital Performance Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Horizontal Performance Metrics */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-900">Performance Metrics</h3>
            </div>

            <div className="space-y-6">
              {getPerformanceMetrics().map((metric, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{metric.value}%</span>
                      <span className="text-sm text-gray-500">/ {metric.target}%</span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={cn("h-3 rounded-full transition-all duration-1000 ease-out", metric.color)}
                        style={{ width: `${metric.value}%` }}
                      ></div>
                    </div>
                    <div
                      className="absolute top-0 w-1 h-3 bg-gray-400 rounded-full"
                      style={{ left: `${metric.target}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Target: {metric.target}%</span>
                    <span className={cn(
                      "font-medium px-2 py-1 rounded-full text-xs",
                      metric.status === 'excellent' ? 'bg-green-100 text-green-700' :
                        metric.status === 'good' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                    )}>
                      {metric.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Insights & Recommendations */}
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Lightbulb className="w-6 h-6 text-teal-600" />
              <h3 className="text-2xl font-bold text-gray-900">Smart Insights</h3>
              <div className="ml-auto px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-semibold">
                LIVE
              </div>
            </div>

            <div className="space-y-4">
              {getAIInsights().map((insight) => (
                <div
                  key={insight.id}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-xl",
                      insight.type === 'recommendation' ? 'bg-green-100 text-green-600' :
                        insight.type === 'prediction' ? 'bg-blue-100 text-blue-600' :
                          'bg-teal-100 text-teal-600'
                    )}>
                      {insight.icon}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">{insight.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            insight.impact === 'High' ? 'bg-red-100 text-red-700' :
                              insight.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                          )}>
                            {insight.impact}
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-teal-500" />
                          <span className="text-sm text-gray-500">Confidence: {insight.confidence}%</span>
                        </div>
                        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                          View Details <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Hospital Capacity Visualization */}
        {metrics && (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Activity className="w-6 h-6 text-red-500" />
                <h3 className="text-2xl font-bold text-gray-900">Live Hospital Capacity</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Real-time</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Bed Occupancy */}
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.bedOccupancy / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{metrics.bedOccupancy}%</div>
                      <div className="text-xs text-gray-500">Occupied</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Bed Occupancy</h4>
                  <p className="text-sm text-gray-600">{metrics.occupiedBeds ?? Math.round(metrics.bedOccupancy * 0.6)} / {metrics.totalBeds ?? 60} beds</p>
                </div>
              </div>

              {/* ICU Usage */}
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#ef4444"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.icuUsage / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-500">{metrics.icuUsage}%</div>
                      <div className="text-xs text-gray-500">Used</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">ICU Capacity</h4>
                  <p className="text-sm text-gray-600">{Math.round((metrics.icuUsage * 9) / 100)} / 9 beds</p>
                </div>
              </div>

              {/* Staff Availability */}
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#10b981"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - metrics.staffAvailability / 100)}`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{metrics.staffAvailability}%</div>
                      <div className="text-xs text-gray-500">Available</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Staff Availability</h4>
                  <p className="text-sm text-gray-600">{metrics.onDutyDoctors ?? Math.round(metrics.staffAvailability * 0.12)} / {metrics.totalDoctors ?? 12} staff</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hospital Performance Score */}
        <div className="bg-gradient-to-r from-blue-500 via-teal-600 to-cyan-500 rounded-3xl p-8 text-white shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Overall Hospital Performance Score</h3>
                <p className="text-blue-100">Comprehensive performance evaluation</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold mb-1">94</div>
              <div className="text-lg text-blue-100">Excellent</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Efficiency', score: 96, icon: <Zap className="w-6 h-6" /> },
              { label: 'Safety', score: 98, icon: <Shield className="w-6 h-6" /> },
              { label: 'Innovation', score: 92, icon: <Brain className="w-6 h-6" /> },
              { label: 'Care Quality', score: 94, icon: <Heart className="w-6 h-6" /> }
            ].map((item, index) => (
              <div key={index} className="space-y-3">
                <div className="p-3 bg-white/20 rounded-2xl w-fit mx-auto">
                  {item.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold">{item.score}</div>
                  <div className="text-blue-100">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;