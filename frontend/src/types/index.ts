// Core data types for the Predictive Hospital AI Dashboard

// Hospital Metrics
export interface Patient {
  id: number | string;
  name: string;
  age: number;
  gender: string;
  avatar: string;
  phone: string;
  email: string;
  address: string;
  condition: string;
  status: 'Critical' | 'Stable' | 'Under Observation' | 'Discharged';
  doctor: string;
  room: string;
  admitDate: string;
  bloodGroup: string;
  lastVisit: string;
  vitals: {
    bp: string;
    temp: string;
    pulse: string;
    oxygen: string;
  };
  history?: PatientHistory[];
  reports?: PatientReport[];
  summary?: string;
}

export interface PatientHistory {
  date: string;
  diagnosis: string;
  treatment: string;
  doctor: string;
  notes: string;
}

export interface PatientReport {
  id: string;
  name: string;
  date: string;
  type: 'Lab' | 'Radiology' | 'Prescription';
  status: 'Ready' | 'Pending';
}
export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification?: string;
  isOnDuty: boolean;
  currentPatientCount: number;
  maxPatients: number;
  avatar?: string; // Optional, for UI
  assistant?: string; // Optional, for UI
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
  apiLatency: number;
  lastUpdated: Date;
}

export interface HospitalMetrics {
  aqi: number;
  bedOccupancy: number;
  icuUsage: number;
  staffAvailability: number;
  timestamp: Date;
  totalDoctors?: number;
  onDutyDoctors?: number;
  activePatients?: number;
  occupiedICUBeds?: number;
  totalBeds?: number;
  occupiedBeds?: number;
}

// Patient Forecast
export interface PatientForecast {
  date: Date;
  predicted: number;
  confidence: number;
  eventType?: EventType;
}

// Alert System
export interface Alert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: Date;
  severity: Severity;
}

// Recommendations
export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: Priority;
  status: RecommendationStatus;
  createdAt: Date;
}

// Explanations
export interface Explanation {
  id: string;
  title: string;
  details: ExplanationDetail[];
  confidence: number;
  sources: DataSource[];
}

export interface ExplanationDetail {
  factor: string;
  value: string;
  impact: string;
  change?: string;
}

export interface DataSource {
  name: string;
  url?: string;
  lastUpdated: Date;
}

// Union Types and Enums
export type SystemStatus = 'normal' | 'alert' | 'surge';

export type AlertType = 'surge' | 'warning' | 'info';

export type Severity = 'high' | 'medium' | 'low';

export type Priority = 'high' | 'medium' | 'low';

export type EventType = 'festival' | 'pollution' | 'epidemic' | 'all';

export type Timeframe = '24h' | '72h' | '7d';

export type RecommendationCategory = 'staffing' | 'supplies' | 'advisory';

export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed' | 'modified';

// Filter interfaces
export interface PredictionFilters {
  eventType: EventType;
  timeframe: Timeframe;
}

// Component Props interfaces
export interface TopNavbarProps {
  title: string;
  currentTime: Date;
  status: SystemStatus;
}

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobile: boolean;
  isCollapsed: boolean;
  onToggle: () => void;
}

export interface OverviewPageProps {
  metrics: HospitalMetrics;
  forecastData: PatientForecast[];
  alerts: Alert[];
}

export interface PredictionsPageProps {
  forecastData: PatientForecast[];
  filters: PredictionFilters;
  onFilterChange: (filters: PredictionFilters) => void;
}

export interface RecommendationsPageProps {
  recommendations: Recommendation[];
  onRecommendationAction: (id: string, action: 'accept' | 'modify' | 'dismiss') => void;
}

export interface ExplainabilityPageProps {
  explanations: Explanation[];
}

// Chart data interfaces
export interface ChartDataPoint {
  date: string;
  value: number;
  confidence?: number;
  eventType?: EventType;
}

export interface StatsCardData {
  title: string;
  value: number;
  unit: string;
  trend?: number;
  status?: SystemStatus;
}