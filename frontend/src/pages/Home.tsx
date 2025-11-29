import React, { useState, useEffect } from 'react';
import { WeatherService, WeatherData, WeatherForecast } from '@/services/weatherService';
import { DiseaseSurgeService, DiseaseData, RegionalAlert } from '@/services/diseaseSurgeService';
import NavigationChips from '@/components/shared/NavigationChips';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHospital } from '@/contexts/HospitalContext';
import {
  Cloud,
  Thermometer,
  Droplets,
  Wind,
  Eye,
  Sun,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  Shield,
  ChevronRight,
  Bed,
  Heart,
  Stethoscope,
  UserCheck,
  Clock,
  Building2,
  Ambulance,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Home: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [diseases, setDiseases] = useState<DiseaseData[]>([]);
  const [alerts, setAlerts] = useState<RegionalAlert[]>([]);
  const [activeChip, setActiveChip] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { hospitalData, isRegistered } = useHospital();
  const weatherService = WeatherService.getInstance();
  const diseaseService = DiseaseSurgeService.getInstance();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const weatherData = weatherService.getCurrentWeather();
      const forecastData = weatherService.getWeatherForecast(5);
      const diseaseData = diseaseService.getCurrentDiseaseData();
      const alertData = diseaseService.getRegionalAlerts();
      
      setWeather(weatherData);
      setForecast(forecastData);
      setDiseases(diseaseData.slice(0, 6)); // Top 6 diseases
      setAlerts(alertData);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleChipChange = (chipId: string, path: string) => {
    setActiveChip(chipId);
    navigate(path);
  };


  const getQuickStats = () => {
    if (!weather || diseases.length === 0) return [];
    
    const criticalDiseases = diseases.filter(d => d.severity === 'critical').length;
    const totalCases = diseases.reduce((sum, d) => sum + d.currentCases, 0);
    const averageChange = Math.round(diseases.reduce((sum, d) => sum + d.weeklyChange, 0) / diseases.length);
    
    return [
      {
        label: 'Temperature',
        value: `${weather.temperature}°C`,
        icon: <Thermometer className="w-4 h-4" />,
        color: 'bg-gray-600',
        trend: Math.round((Math.random() - 0.5) * 6)
      },
      {
        label: 'Air Quality',
        value: weather.aqi.toString(),
        icon: <Wind className="w-4 h-4" />,
        color: 'bg-gray-700',
        trend: Math.round((Math.random() - 0.5) * 10)
      },
      {
        label: 'Active Cases',
        value: totalCases.toString(),
        icon: <Activity className="w-4 h-4" />,
        color: 'bg-gray-500',
        trend: averageChange
      },
      {
        label: 'Critical Alerts',
        value: criticalDiseases.toString(),
        icon: <AlertTriangle className="w-4 h-4" />,
        color: 'bg-gray-700'
      }
    ];
  };

  // Hospital Capacity Mock Data - This would come from your hospital management system
  const getHospitalCapacity = () => {
    return {
      generalBeds: { occupied: 156, total: 200, percentage: 78 },
      icuBeds: { occupied: 28, total: 35, percentage: 80 },
      emergencyBeds: { occupied: 12, total: 15, percentage: 80 },
      operatingRooms: { occupied: 6, total: 10, percentage: 60 },
      staff: {
        doctors: { available: 45, total: 60, percentage: 75 },
        nurses: { available: 120, total: 180, percentage: 67 },
        technicians: { available: 30, total: 40, percentage: 75 }
      },
      ambulances: { available: 8, total: 12, percentage: 67 }
    };
  };

  const hospitalCapacity = getHospitalCapacity();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-20 bg-gray-200 rounded-3xl"></div>
            <div className="h-64 bg-gray-200 rounded-3xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Welcome back, {hospitalData?.hospitalName || 'Hospital'}!
            </h1>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {hospitalData?.hospitalName || 'Hospital'} • {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <NavigationChips
            activeChip={activeChip}
            onChipChange={handleChipChange}
          />
        </div>

        {/* Regional Disease Alerts - High Priority Position */}
        <div className="bg-gradient-to-br from-soft-blue-100 to-soft-green-100 p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertTriangle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Regional Disease Alerts</h2>
                <p className="text-sm text-gray-600">Live monitoring across Mumbai regions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
                <div className="text-xs text-gray-600">Active Alerts</div>
              </div>
              <button 
                onClick={() => navigate('/predictions')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alerts.slice(0, 3).map((alert, index) => (
              <div
                key={alert.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm text-gray-900">{alert.title}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium bg-white shadow-sm",
                    alert.alertLevel === 'critical' ? 'text-red-700' :
                    alert.alertLevel === 'warning' ? 'text-yellow-700' :
                    'text-blue-700'
                  )}>
                    {alert.alertLevel}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">{alert.description.substring(0, 80)}...</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {alert.region}
                  </span>
                  <span>
                    {Math.ceil((Date.now() - alert.activeSince.getTime()) / (1000 * 60 * 60 * 24))}d ago
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental & Weather Monitor - High Priority */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Current Weather Widget - Takes 3 columns */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-br from-white to-blue-50 text-gray-900 rounded-lg p-6 shadow-sm border border-gray-200 relative overflow-hidden h-full group">
              {/* Enhanced background decoration with animation */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-700 opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full translate-y-12 -translate-x-12 group-hover:scale-110 transition-transform duration-700 opacity-20"></div>
              <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-gray-100 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse opacity-10"></div>
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                      <Cloud className="w-6 h-6 text-gray-600" />
                      Environmental Monitor
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {weather?.location} • Clinical Conditions
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl mb-2 group-hover:scale-110 transition-transform duration-300">
                      {weather && weatherService.getWeatherIcon(weather.condition)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last Updated: {weather?.lastUpdated.toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  <div className="bg-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-md border border-gray-200">
                    <Thermometer className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                    <div className="text-xl font-bold text-gray-900">{weather?.temperature}°C</div>
                    <div className="text-xs text-gray-600">Temperature</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-md border border-gray-200">
                    <Droplets className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                    <div className="text-xl font-bold text-gray-900">{weather?.humidity}%</div>
                    <div className="text-xs text-gray-600">Humidity</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-md border border-gray-200">
                    <Wind className="w-5 h-5 mx-auto mb-2 text-gray-500" />
                    <div className="text-xl font-bold text-gray-900">{weather?.windSpeed}</div>
                    <div className="text-xs text-gray-600">km/h {weather?.windDirection}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center transition-all duration-300 hover:shadow-md border border-gray-200">
                    <Eye className="w-5 h-5 mx-auto mb-2 text-purple-500" />
                    <div className="text-xl font-bold text-gray-900">{weather?.visibility}</div>
                    <div className="text-xs text-gray-600">km visibility</div>
                  </div>
                </div>

                {/* Enhanced Air Quality */}
                <div className="flex-1 flex flex-col justify-end">
                  {weather && (
                    <div className="bg-white rounded-lg p-5 border border-gray-200 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg text-gray-900">Air Quality Index</h3>
                        <div className={cn(
                          "px-4 py-2 rounded-full text-sm font-bold",
                          weatherService.getAQIStatus(weather.aqi).color,
                          "bg-gray-100 text-gray-900"
                        )}>
                          {weatherService.getAQIStatus(weather.aqi).status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold text-gray-900">{weather.aqi}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gray-600 rounded-full h-3 transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min(weather.aqi / 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced 7-Day Clinical Forecast Widget */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-lg p-6 shadow-sm border border-gray-200 h-full hover:shadow-md transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                Environmental Forecast
                <div className="ml-auto w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </h3>
              <div className="space-y-3">
                {forecast.map((day, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-sm transition-all duration-300 border border-gray-200 group cursor-pointer"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                        {weatherService.getWeatherIcon(day.condition)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900">
                          {day.date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Droplets className="w-3 h-3 text-blue-500" />
                          {day.precipitationChance}% rain
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-base text-gray-900 group-hover:text-blue-600 transition-colors">{day.high}°</div>
                      <div className="text-sm text-gray-500">{day.low}°</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Disease Monitoring Dashboard */}
        <div className="bg-gradient-to-br from-soft-blue-100 to-soft-green-100 p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Activity className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Disease Surveillance Monitor</h2>
                <p className="text-sm text-gray-600">Real-time disease tracking across Mumbai regions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{diseases.length}</div>
                <div className="text-xs text-gray-600">Tracked Diseases</div>
              </div>
              <button 
                onClick={() => navigate('/predictions')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {diseases.slice(0, 6).map((disease, index) => (
              <div
                key={disease.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm text-gray-900">{disease.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium bg-white shadow-sm",
                    disease.severity === 'critical' ? 'text-red-700' :
                    disease.severity === 'high' ? 'text-orange-700' :
                    disease.severity === 'moderate' ? 'text-yellow-700' :
                    'text-green-700'
                  )}>
                    {disease.severity}
                  </span>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Current Cases</span>
                    <span className="text-sm font-semibold text-gray-900">{disease.currentCases.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Weekly Change</span>
                    <span className={cn(
                      "text-sm font-semibold flex items-center gap-1",
                      disease.weeklyChange > 0 ? 'text-red-600' : disease.weeklyChange < 0 ? 'text-green-600' : 'text-gray-600'
                    )}>
                      {disease.weeklyChange > 0 && <TrendingUp className="w-3 h-3" />}
                      {disease.weeklyChange < 0 && <TrendingDown className="w-3 h-3" />}
                      {disease.weeklyChange === 0 ? 'No change' : `${disease.weeklyChange > 0 ? '+' : ''}${disease.weeklyChange}%`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Severity Level</span>
                    <div className="flex items-center gap-1">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        disease.severity === 'critical' ? 'bg-red-500' :
                        disease.severity === 'high' ? 'bg-orange-500' :
                        disease.severity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                      )}></div>
                      <span className="text-xs font-medium text-gray-700 capitalize">{disease.severity}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {disease.category.replace('-', ' ')} disease
                  </span>
                  <span>
                    Updated {Math.floor(Math.random() * 24) + 1}h ago
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-gray-900">{diseases.filter(d => d.severity === 'critical').length}</div>
              <div className="text-xs text-gray-600">Critical Diseases</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-gray-900">{diseases.filter(d => d.severity === 'high').length}</div>
              <div className="text-xs text-gray-600">High Risk</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-gray-900">{diseases.reduce((sum, d) => sum + d.currentCases, 0).toLocaleString()}</div>
              <div className="text-xs text-gray-600">Total Cases</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="text-2xl font-bold text-gray-900">{Math.round(diseases.reduce((sum, d) => sum + d.weeklyChange, 0) / diseases.length)}%</div>
              <div className="text-xs text-gray-600">Avg Weekly Change</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
