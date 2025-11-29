import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DiseaseSurgeService, DiseaseData } from '@/services/diseaseSurgeService';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, ChevronRight, Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const Predictions: React.FC = () => {
  const navigate = useNavigate();
  const [diseases, setDiseases] = useState<DiseaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high' | 'moderate' | 'low'>('all');
  const diseaseService = DiseaseSurgeService.getInstance();

  // Load disease data
  useEffect(() => {
    const loadDiseases = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 600));
        const diseaseData = diseaseService.getCurrentDiseaseData();
        setDiseases(diseaseData);
      } catch (err) {
        console.error('Error loading disease data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDiseases();
  }, []);

  // Handle disease card click - navigate to Explainability page with disease ID
  const handleDiseaseClick = (disease: DiseaseData) => {
    navigate(`/explainability?disease=${disease.id}`);
  };

  // Filter diseases based on search and severity
  const filteredDiseases = diseases.filter(disease => {
    const matchesSearch = searchTerm === '' || 
      disease.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      disease.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || disease.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  // Get statistics
  const stats = {
    total: diseases.length,
    critical: diseases.filter(d => d.severity === 'critical').length,
    high: diseases.filter(d => d.severity === 'high').length,
    totalCases: diseases.reduce((sum, d) => sum + d.currentCases, 0),
    avgChange: Math.round(diseases.reduce((sum, d) => sum + d.weeklyChange, 0) / diseases.length)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Regional Disease Predictions</h1>
        <p className="text-gray-600 mt-1">
          Monitor and predict disease surges across Mumbai regions
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Diseases</div>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Critical Alerts</div>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.critical + stats.high}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Total Cases</div>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalCases.toLocaleString()}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-600">Avg Weekly Change</div>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              {stats.avgChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-orange-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            stats.avgChange >= 0 ? "text-orange-600" : "text-green-600"
          )}>
            {stats.avgChange >= 0 ? '+' : ''}{stats.avgChange}%
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-gradient-to-br from-soft-blue-50 to-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Filter className="w-5 h-5 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Search & Filter Diseases</h3>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search diseases by name or category..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  'text-sm text-gray-900 placeholder-gray-400 shadow-sm'
                )}
              />
            </div>
          </div>

          {/* Severity Filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All', count: diseases.length },
              { value: 'critical', label: 'Critical', count: stats.critical },
              { value: 'high', label: 'High', count: stats.high },
              { value: 'moderate', label: 'Moderate', count: diseases.filter(d => d.severity === 'moderate').length },
              { value: 'low', label: 'Low', count: diseases.filter(d => d.severity === 'low').length }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSeverityFilter(option.value as any)}
                className={cn(
                  'px-4 py-2 rounded-lg border text-sm font-medium transition-all whitespace-nowrap',
                  severityFilter === option.value ? [
                    'border-blue-300 bg-white shadow-md text-blue-700'
                  ] : [
                    'border-gray-200 bg-white text-gray-600 hover:shadow-md hover:border-gray-300'
                  ]
                )}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>
        
        {/* Filter Summary */}
        {(searchTerm || severityFilter !== 'all') && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {filteredDiseases.length} of {diseases.length} diseases
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setSeverityFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Disease Cards Grid */}
      {isLoading ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Loading Diseases...</h3>
          <p className="text-gray-500">Please wait while we load disease data</p>
        </div>
      ) : filteredDiseases.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Diseases Found</h3>
          <p className="text-gray-500">
            {searchTerm || severityFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No disease data is currently available'
            }
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDiseases.map((disease) => (
              <button
                key={disease.id}
                onClick={() => handleDiseaseClick(disease)}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-xl transition-all bg-gradient-to-br from-white to-gray-50 text-left group cursor-pointer"
              >
                {/* Disease Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                      {disease.name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">{disease.category.replace('-', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm",
                      disease.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      disease.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      disease.severity === 'moderate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {disease.severity}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
                
                {/* Disease Stats */}
                <div className="space-y-3 mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Current Cases</span>
                      <span className="text-xl font-bold text-gray-900">{disease.currentCases.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Weekly Change</span>
                      <span className={cn(
                        "text-base font-bold flex items-center gap-1.5",
                        disease.weeklyChange > 0 ? 'text-red-600' : disease.weeklyChange < 0 ? 'text-green-600' : 'text-gray-600'
                      )}>
                        {disease.weeklyChange > 0 && <TrendingUp className="w-4 h-4" />}
                        {disease.weeklyChange < 0 && <TrendingDown className="w-4 h-4" />}
                        {disease.weeklyChange === 0 ? 'No change' : `${disease.weeklyChange > 0 ? '+' : ''}${disease.weeklyChange}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disease Footer */}
                <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full animate-pulse",
                      disease.severity === 'critical' ? 'bg-red-500' :
                      disease.severity === 'high' ? 'bg-orange-500' :
                      disease.severity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                    )}></div>
                    <span className="text-xs font-medium text-gray-700">Active Alert</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Click for details
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className="bg-gradient-to-br from-soft-blue-100 to-soft-green-100 border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-700">
                <span className="font-medium">Tip:</span>
                <span className="ml-2">Click on any disease card to view detailed analysis and predictions</span>
              </div>
              <div className="text-gray-600">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Predictions;
