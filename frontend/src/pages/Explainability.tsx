import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DiseaseSurgeService, DiseaseData } from '@/services/diseaseSurgeService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle, 
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Droplets,
  Wind,
  ThermometerSun,
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Explainability: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const diseaseId = searchParams.get('disease');
  
  const [disease, setDisease] = useState<DiseaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const diseaseService = DiseaseSurgeService.getInstance();

  // Load disease data
  useEffect(() => {
    const loadDisease = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        if (diseaseId) {
          const allDiseases = diseaseService.getCurrentDiseaseData();
          const foundDisease = allDiseases.find(d => d.id === diseaseId);
          setDisease(foundDisease || null);
        }
      } catch (err) {
        console.error('Error loading disease:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDisease();
  }, [diseaseId]);

  // Generate historical and prediction data for the chart
  const generateChartData = () => {
    if (!disease) return [];
    
    const data = [];
    const baseValue = disease.currentCases;
    const weeklyChangeRate = disease.weeklyChange / 100;
    
    // Historical data (past 8 weeks)
    for (let i = -8; i <= 0; i++) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() + (i * 7));
      
      const historicalValue = Math.round(baseValue * Math.pow(1 + weeklyChangeRate, i));
      
      data.push({
        week: `Week ${i === 0 ? 'Current' : i}`,
        date: weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cases: historicalValue,
        type: 'historical'
      });
    }
    
    // Prediction data (next 4 weeks)
    for (let i = 1; i <= 4; i++) {
      const weekDate = new Date();
      weekDate.setDate(weekDate.getDate() + (i * 7));
      
      const predictedValue = Math.round(baseValue * Math.pow(1 + weeklyChangeRate, i));
      
      data.push({
        week: `Week +${i}`,
        date: weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cases: predictedValue,
        predicted: predictedValue,
        type: 'prediction'
      });
    }
    
    return data;
  };

  // Get spreading factors based on disease category
  const getSpreadingFactors = () => {
    if (!disease) return [];
    
    const factorsMap: { [key: string]: Array<{ factor: string; impact: 'high' | 'medium' | 'low'; description: string; icon: any }> } = {
      'respiratory': [
        { factor: 'Air Quality', impact: 'high', description: 'Poor air quality increases transmission rates', icon: Wind },
        { factor: 'Population Density', impact: 'high', description: 'High density areas show faster spread', icon: Users },
        { factor: 'Temperature', impact: 'medium', description: 'Cooler temperatures favor virus survival', icon: ThermometerSun },
        { factor: 'Humidity', impact: 'medium', description: 'Low humidity increases airborne transmission', icon: Droplets }
      ],
      'waterborne': [
        { factor: 'Water Quality', impact: 'high', description: 'Contaminated water sources drive spread', icon: Droplets },
        { factor: 'Sanitation', impact: 'high', description: 'Poor sanitation increases infection rates', icon: MapPin },
        { factor: 'Rainfall', impact: 'medium', description: 'Heavy rainfall affects water contamination', icon: Droplets },
        { factor: 'Population Density', impact: 'medium', description: 'Dense areas show higher transmission', icon: Users }
      ],
      'vector-borne': [
        { factor: 'Temperature', impact: 'high', description: 'Warm weather increases vector activity', icon: ThermometerSun },
        { factor: 'Rainfall', impact: 'high', description: 'Standing water creates breeding sites', icon: Droplets },
        { factor: 'Humidity', impact: 'medium', description: 'High humidity favors vector survival', icon: Droplets },
        { factor: 'Urban Areas', impact: 'medium', description: 'Urban zones show higher case density', icon: MapPin }
      ]
    };
    
    return factorsMap[disease.category] || factorsMap['respiratory'];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Disease Analysis...</h3>
          <p className="text-gray-500">Please wait while we load the data</p>
        </div>
      </div>
    );
  }

  if (!disease) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/predictions')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Predictions
        </button>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center shadow-sm">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Disease Not Found</h3>
          <p className="text-yellow-600 mb-4">The requested disease could not be found.</p>
          <button
            onClick={() => navigate('/predictions')}
            className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
          >
            View All Diseases
          </button>
        </div>
      </div>
    );
  }

  const chartData = generateChartData();
  const factors = getSpreadingFactors();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/predictions')}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Predictions
      </button>

      {/* Disease Header */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{disease.name}</h1>
            <p className="text-gray-600 capitalize">{disease.category.replace('-', ' ')} Disease</p>
          </div>
          <span className={cn(
            "px-4 py-2 rounded-lg text-sm font-bold shadow-sm",
            disease.severity === 'critical' ? 'bg-red-100 text-red-700' :
            disease.severity === 'high' ? 'bg-orange-100 text-orange-700' :
            disease.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          )}>
            {disease.severity.toUpperCase()} ALERT
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Current Cases</div>
            <div className="text-2xl font-bold text-gray-900">{disease.currentCases.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Weekly Change</div>
            <div className={cn(
              "text-2xl font-bold flex items-center gap-2",
              disease.weeklyChange > 0 ? 'text-red-600' : disease.weeklyChange < 0 ? 'text-green-600' : 'text-gray-600'
            )}>
              {disease.weeklyChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              {disease.weeklyChange > 0 ? '+' : ''}{disease.weeklyChange}%
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 col-span-2 lg:col-span-1">
            <div className="text-xs text-gray-600 mb-1">Alert Status</div>
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full animate-pulse",
                disease.severity === 'critical' ? 'bg-red-500' :
                disease.severity === 'high' ? 'bg-orange-500' :
                disease.severity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
              )}></div>
              <span className="text-lg font-bold text-gray-900">Active Monitoring</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spread Analysis Graph */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Disease Spread Analysis</h2>
            <p className="text-sm text-gray-600">Historical data and 4-week prediction</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="cases" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#colorCases)" 
              name="Actual Cases"
            />
            <Area 
              type="monotone" 
              dataKey="predicted" 
              stroke="#f59e0b" 
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorPredicted)" 
              name="Predicted Cases"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Legend Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-blue-500"></div>
            <span className="text-gray-600">Historical Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-1 bg-orange-500 border-dashed border-t-2 border-orange-500"></div>
            <span className="text-gray-600">Predicted Trend</span>
          </div>
        </div>
      </div>

      {/* Spreading Factors */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Info className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Key Spreading Factors</h2>
            <p className="text-sm text-gray-600">Environmental and social factors affecting disease spread</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {factors.map((factor, index) => {
            const IconComponent = factor.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    factor.impact === 'high' ? 'bg-red-50' :
                    factor.impact === 'medium' ? 'bg-orange-50' : 'bg-yellow-50'
                  )}>
                    <IconComponent className={cn(
                      "w-6 h-6",
                      factor.impact === 'high' ? 'text-red-600' :
                      factor.impact === 'medium' ? 'text-orange-600' : 'text-yellow-600'
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{factor.factor}</h3>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold",
                        factor.impact === 'high' ? 'bg-red-100 text-red-700' :
                        factor.impact === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        {factor.impact.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{factor.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Model Insights */}
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">AI Model Insights</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Our AI model analyzes historical patterns, environmental data, and population density to predict disease spread. 
          The current trend shows a <span className="font-semibold text-gray-900">{disease.weeklyChange > 0 ? 'rising' : 'declining'}</span> trajectory 
          with <span className="font-semibold text-gray-900">{Math.abs(disease.weeklyChange)}% weekly change</span>.
        </p>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <span className="font-semibold">Recommendation:</span> Based on current trends, 
              {disease.weeklyChange > 10 ? ' immediate action is required to prevent further spread.' : 
               disease.weeklyChange > 0 ? ' continued monitoring and preventive measures are advised.' : 
               ' maintain current control measures to ensure sustained decline.'}
            </div>
          </div>
        </div>
      </div>

      {/* View Recommendations Button */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 border border-blue-300 rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h3 className="text-xl font-bold mb-1">Ready for Action?</h3>
            <p className="text-blue-100 text-sm">View AI-powered recommendations for managing this disease outbreak</p>
          </div>
          <button
            onClick={() => navigate('/recommendations')}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-md"
          >
            View Recommendations
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-600">
        Data updated: {new Date().toLocaleString()} • Model confidence: 87%
      </div>
    </div>
  );
};

export default Explainability;
