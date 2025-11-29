import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '@/contexts/HospitalContext';
import {
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  Bed,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Phone,
  FileText,
  BarChart3,
  Heart,
  Stethoscope,
  Pill,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { HospitalMetrics } from '@/types';
import { dataService } from '@/services/dataService';

// Mock hospital data for demonstration
interface HospitalStats {
  bedOccupancy: { total: number; occupied: number; available: number; };
  patientFlow: { admissions: number; discharges: number; transfers: number; };
  staffOnDuty: { doctors: number; nurses: number; support: number; };
  emergencyStatus: 'normal' | 'busy' | 'critical';
  avgWaitTime: number;
  criticalPatients: number;
}

interface DepartmentStatus {
  name: string;
  capacity: number;
  current: number;
  status: 'normal' | 'warning' | 'critical';
  waitTime: number;
}

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [metrics, setMetrics] = useState<HospitalMetrics | null>(null);

  const navigate = useNavigate();
  const { hospitalData, isRegistered } = useHospital();

  // Enhanced hospital operational data with trends
  // We will derive this from metrics
  const [hospitalStats, setHospitalStats] = useState<HospitalStats>({
    bedOccupancy: { total: 450, occupied: 387, available: 63 },
    patientFlow: { admissions: 42, discharges: 38, transfers: 7 },
    staffOnDuty: { doctors: 85, nurses: 162, support: 94 },
    emergencyStatus: 'busy',
    avgWaitTime: 18,
    criticalPatients: 12
  });

  // Smart KPIs with enhanced visual data
  const getSmartKPIs = () => {
    const bedOccupancyPercentage = Math.round((hospitalStats.bedOccupancy.occupied / hospitalStats.bedOccupancy.total) * 100);
    const totalStaff = hospitalStats.staffOnDuty.doctors + hospitalStats.staffOnDuty.nurses + hospitalStats.staffOnDuty.support;

    return [
      {
        title: 'Bed Occupancy',
        value: bedOccupancyPercentage,
        target: 85,
        current: hospitalStats.bedOccupancy.occupied,
        total: hospitalStats.bedOccupancy.total,
        unit: '%',
        icon: <Bed className="w-6 h-6" />,
        color: 'from-medical-500 to-medical-600',
        trend: 8,
        status: bedOccupancyPercentage > 90 ? 'critical' : bedOccupancyPercentage > 80 ? 'warning' : 'good',
        description: `${hospitalStats.bedOccupancy.occupied} of ${hospitalStats.bedOccupancy.total} beds occupied`,
        comparison: `Target: 85% optimal`
      },
      {
        title: 'Critical Patients',
        value: hospitalStats.criticalPatients,
        target: 15,
        current: hospitalStats.criticalPatients,
        total: 50,
        unit: 'patients',
        icon: <Heart className="w-6 h-6" />,
        color: 'from-red-500 to-red-600',
        trend: -2,
        status: hospitalStats.criticalPatients > 20 ? 'critical' : hospitalStats.criticalPatients > 10 ? 'warning' : 'good',
        description: `${hospitalStats.criticalPatients} patients in critical condition`,
        comparison: `Max capacity: 50 critical beds`
      },
      {
        title: 'Staff on Duty',
        value: Math.round((totalStaff / 380) * 100),
        target: 90,
        current: totalStaff,
        total: 380,
        unit: '%',
        icon: <Users className="w-6 h-6" />,
        color: 'from-teal-500 to-teal-600',
        trend: 5,
        status: totalStaff > 340 ? 'excellent' : totalStaff > 300 ? 'good' : 'warning',
        description: `${totalStaff} staff members currently on duty`,
        comparison: `Target: 342 staff (90%)`
      },
      {
        title: 'Avg Wait Time',
        value: hospitalStats.avgWaitTime,
        target: 15,
        current: hospitalStats.avgWaitTime,
        total: 60,
        unit: 'min',
        icon: <Clock className="w-6 h-6" />,
        color: 'from-yellow-500 to-yellow-600',
        trend: -3,
        status: hospitalStats.avgWaitTime > 30 ? 'critical' : hospitalStats.avgWaitTime > 20 ? 'warning' : 'good',
        description: `${hospitalStats.avgWaitTime} minutes average wait time`,
        comparison: `Target: <15 minutes`
      }
    ];
  };

  const [departments] = useState<DepartmentStatus[]>([
    { name: 'Emergency', capacity: 50, current: 47, status: 'critical', waitTime: 25 },
    { name: 'ICU', capacity: 40, current: 38, status: 'warning', waitTime: 0 },
    { name: 'General Ward', capacity: 200, current: 156, status: 'normal', waitTime: 12 },
    { name: 'Pediatrics', capacity: 60, current: 32, status: 'normal', waitTime: 8 },
    { name: 'Maternity', capacity: 45, current: 28, status: 'normal', waitTime: 5 },
    { name: 'Surgery', capacity: 25, current: 18, status: 'normal', waitTime: 15 }
  ]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await dataService.getHospitalMetrics();
        setMetrics(data);

        // Update hospital stats based on fetched metrics
        if (data) {
          const totalBeds = data.totalBeds || 60;
          const occupiedBeds = data.occupiedBeds || Math.round(data.bedOccupancy * totalBeds / 100);
          const activePatients = data.activePatients || 0;

          setHospitalStats(prev => ({
            ...prev,
            bedOccupancy: {
              total: totalBeds,
              occupied: occupiedBeds,
              available: totalBeds - occupiedBeds
            },
            staffOnDuty: {
              ...prev.staffOnDuty,
              doctors: data.onDutyDoctors || prev.staffOnDuty.doctors
            },
            patientFlow: {
              admissions: activePatients,
              // If we have 0 active patients, assume 0 discharges/transfers for consistency
              discharges: activePatients > 0 ? Math.round(activePatients * 0.8) : 0,
              transfers: activePatients > 0 ? Math.round(activePatients * 0.1) : 0
            },
            criticalPatients: data.occupiedICUBeds || 0
          }));
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData();
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);




  const getBedOccupancyColor = (percentage: number) => {
    if (percentage >= 95) return 'bg-red-500';
    if (percentage >= 85) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'warning': return 'border-yellow-500 bg-yellow-50';
      case 'normal': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getEmergencyStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'busy': return 'bg-yellow-100 text-yellow-800';
      case 'normal': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const bedOccupancyPercentage = Math.round((hospitalStats.bedOccupancy.occupied / hospitalStats.bedOccupancy.total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-blue-50/20 to-purple-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Hospital Operations Center
              {!isRegistered && (
                <span className="ml-3 text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                  Demo Mode
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                hospitalStats.emergencyStatus === 'critical' ? 'bg-red-500' :
                  hospitalStats.emergencyStatus === 'busy' ? 'bg-yellow-500' : 'bg-green-500'
              )}></div>
              Live monitoring • {hospitalData?.hospitalName || 'Sample Hospital'} • Mumbai, India
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Home</span>
            </button>
            <div className="text-right">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <div className={cn(
                "inline-block px-4 py-2 rounded-lg text-sm font-semibold mt-2",
                getEmergencyStatusColor(hospitalStats.emergencyStatus)
              )}>
                Status: {hospitalStats.emergencyStatus.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Stats Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Beds Card - Clickable */}
          <div
            onClick={() => navigate('/beds')}
            className="bg-gradient-to-br from-blue-50 via-blue-50/30 to-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Bed className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Total Beds</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {hospitalStats.bedOccupancy.total}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-white/80 text-gray-700 rounded text-xs font-medium shadow-sm">
                  {hospitalStats.bedOccupancy.available} Available
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Click to view detailed bed management
              </div>
            </div>
          </div>

          {/* Doctors Card - Clickable */}
          <div
            onClick={() => navigate('/doctors')}
            className="bg-gradient-to-br from-green-50 via-green-50/30 to-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Stethoscope className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Doctors</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {hospitalStats.staffOnDuty.doctors}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-white/80 text-gray-700 rounded text-xs font-medium shadow-sm">Available</span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {Math.floor(hospitalStats.staffOnDuty.doctors * 0.1)} Leave
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Click to view doctor schedules and status
              </div>
            </div>
          </div>

          {/* Patients Card - Clickable */}
          <div
            onClick={() => navigate('/patients')}
            className="bg-gradient-to-br from-purple-50 via-purple-50/30 to-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Patients</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {hospitalStats.bedOccupancy.occupied}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-3 h-3" />
                  12%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Click to view patient directory and records
              </div>
            </div>
          </div>

          {/* Appointments Card - Clickable */}
          <div
            onClick={() => navigate('/appointments')}
            className="bg-gradient-to-br from-amber-50 via-amber-50/30 to-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">Appointments</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-gray-900">
                {hospitalStats.patientFlow.admissions + hospitalStats.patientFlow.transfers}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-white/80 text-gray-700 rounded text-xs font-medium shadow-sm">Today</span>
              </div>
              <div className="text-xs text-gray-500">
                Click for smart appointment booking
              </div>
            </div>
          </div>
        </div>

        {/* Smart Hospital Widgets - Compact Design */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Real-Time Resource Monitor - Wait Time Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Resource Monitor</h2>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            </div>

            <div className="space-y-3">
              {/* Average Wait Time - TOP PRIORITY */}
              <div className="p-3 bg-gradient-to-br from-amber-50/50 to-white rounded-lg border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Avg. Wait Time</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900">{hospitalStats.avgWaitTime}<span className="text-sm text-gray-600 ml-0.5">min</span></div>
                  </div>
                </div>
              </div>

              {/* Bed Capacity */}
              <div className="p-3 bg-gradient-to-br from-blue-50/50 to-white rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded">
                      <Bed className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Bed Capacity</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{bedOccupancyPercentage}%</span>
                </div>
                <div className="relative w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      bedOccupancyPercentage > 85 ? 'bg-red-400' :
                        bedOccupancyPercentage > 70 ? 'bg-yellow-400' : 'bg-green-400'
                    )}
                    style={{ width: `${bedOccupancyPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{hospitalStats.bedOccupancy.occupied} Occupied</span>
                  <span>{hospitalStats.bedOccupancy.available} Available</span>
                </div>
              </div>

              {/* Staff on Duty */}
              <div className="p-3 bg-gradient-to-br from-green-50/50 to-white rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-green-100 rounded">
                      <Users className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Staff on Duty</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {hospitalStats.staffOnDuty.doctors + hospitalStats.staffOnDuty.nurses + hospitalStats.staffOnDuty.support}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center p-1.5 bg-white rounded border border-gray-100">
                    <div className="text-sm font-bold text-gray-900">{hospitalStats.staffOnDuty.doctors}</div>
                    <div className="text-xs text-gray-600">Doctors</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-gray-100">
                    <div className="text-sm font-bold text-gray-900">{hospitalStats.staffOnDuty.nurses}</div>
                    <div className="text-xs text-gray-600">Nurses</div>
                  </div>
                  <div className="text-center p-1.5 bg-white rounded border border-gray-100">
                    <div className="text-sm font-bold text-gray-900">{hospitalStats.staffOnDuty.support}</div>
                    <div className="text-xs text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Department Status - Compact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Department Status</h2>
              <span className="text-xs text-gray-500">Live Updates</span>
            </div>

            <div className="space-y-2">
              {departments.map((dept, index) => {
                const occupancyPercentage = Math.round((dept.current / dept.capacity) * 100);
                return (
                  <div key={index} className="p-3 bg-gradient-to-br from-gray-50/50 to-white rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{dept.name}</p>
                        <p className="text-xs text-gray-500">{dept.current}/{dept.capacity} capacity</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs text-gray-600">
                          <Clock className="w-3 h-3 inline mr-0.5" />
                          {dept.waitTime}m
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          dept.status === 'critical' ? 'bg-red-100 text-red-700' :
                            dept.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                        )}>
                          {occupancyPercentage}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Today's Operations - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Today's Operations</h2>
            <span className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-50/50 to-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{hospitalStats.patientFlow.admissions}</div>
                  <div className="text-xs text-gray-600">Admissions</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">↑ 8% vs yesterday</div>
            </div>

            <div className="p-3 bg-gradient-to-br from-green-50/50 to-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{hospitalStats.patientFlow.discharges}</div>
                  <div className="text-xs text-gray-600">Discharges</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">↑ 12% vs yesterday</div>
            </div>

            <div className="p-3 bg-gradient-to-br from-purple-50/50 to-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{hospitalStats.patientFlow.admissions + hospitalStats.patientFlow.transfers}</div>
                  <div className="text-xs text-gray-600">Appointments</div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Total scheduled</div>
            </div>

            <div className="p-3 bg-gradient-to-br from-red-50/50 to-white rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{hospitalStats.criticalPatients}</div>
                  <div className="text-xs text-gray-600">Critical</div>
                </div>
              </div>
              <div className="text-xs text-red-600 font-medium">Needs attention</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-soft-blue-100 to-soft-green-100 rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <span className="text-sm text-gray-500">Common tasks</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/data-import')}
              className="group p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 bg-soft-blue-100 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <Upload className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Import Data</div>
              <div className="text-xs text-gray-500">Upload patient records</div>
            </button>

            <button className="group p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-soft-green-100 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <Download className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Export Reports</div>
              <div className="text-xs text-gray-500">Download analytics</div>
            </button>

            <button
              onClick={() => navigate('/analytics')}
              className="group p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              <div className="w-10 h-10 bg-soft-purple-100 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <BarChart3 className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Analytics</div>
              <div className="text-xs text-gray-500">View insights</div>
            </button>

            <button className="group p-5 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="w-10 h-10 bg-soft-yellow-100 rounded-lg flex items-center justify-center mb-3 shadow-sm">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-sm font-semibold text-gray-900 mb-1">Logs</div>
              <div className="text-xs text-gray-500">Activity history</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
