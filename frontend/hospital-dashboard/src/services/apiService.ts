import {
  HospitalMetrics,
  PatientForecast,
  Alert,
  Recommendation,
  Explanation,
  SystemStatus,
  EventType,
  Doctor,
  Patient
} from '@/types';
import { MockDataService } from './mockDataService';

const API_BASE_URL = 'https://samruddhi-backend.onrender.com';
const HOSPITAL_ID = 'a1b2c3d4-1111-4444-8888-111111111111';

export class ApiService {
  private static instance: ApiService;
  private mockService: MockDataService;

  constructor() {
    this.mockService = MockDataService.getInstance();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      console.log('Initializing ApiService');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('HOSPITAL_ID:', HOSPITAL_ID);
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private CACHE_TTL = 60 * 1000; // 60 seconds cache

  private async fetchJson(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`;

    // Check cache for GET requests
    if (!options || options.method === 'GET' || !options.method) {
      const cached = this.cache.get(url);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`Serving from cache: ${url}`);
        return cached.data;
      }
    }

    console.log(`Fetching: ${url}`);

    // Add Auth token if available
    const token = localStorage.getItem('token');
    const headers = {
      ...options?.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        console.error(`API Error ${response.status}: ${response.statusText}`);
        throw new Error(`API Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log(`Success: ${url}`, data);

      // Cache the response for GET requests
      if (!options || options.method === 'GET' || !options.method) {
        this.cache.set(url, { data, timestamp: Date.now() });
      }

      return data;
    } catch (error) {
      console.error(`Fetch failed for ${url}:`, error);
      throw error;
    }
  }

  async getHospitalMetrics(): Promise<HospitalMetrics> {
    // Get mock data first to serve as fallback/base
    const mockMetrics = await this.mockService.getHospitalMetrics();

    try {
      const data = await this.fetchJson(`/hospitals/${HOSPITAL_ID}/dashboard`);

      // Helper to get real value or small random mock if 0
      // User requested: "if zero/field not available add maybe 2-8 number"
      const getValue = (real: number | undefined, mock: number, minMock: number = 2, maxMock: number = 8) => {
        if (real && real > 0) return real;
        // If real is 0 or undefined, return a small random number (or the large mock if needed, but user asked for 2-8)
        // For things like total beds, we should keep the large mock.
        // For active patients/occupied beds, we use the small range.
        return Math.floor(Math.random() * (maxMock - minMock + 1)) + minMock;
      };

      const patients = await this.getPatients();
      const activePatients = getValue(data.active_admissions, patients.length, patients.length, patients.length);
      const occupiedICUBeds = getValue(data.beds?.icu?.occupied, mockMetrics.occupiedICUBeds || 2, 1, 5);
      const occupiedBeds = getValue(data.capacity_summary?.occupied_beds, mockMetrics.occupiedBeds || 10, 8, 25);

      // Map API response to HospitalMetrics, using mock data for missing fields
      return {
        ...mockMetrics,
        // Use real data if available, otherwise keep mock value
        // Detailed metrics mapping
        totalBeds: data.capacity_summary?.total_beds || mockMetrics.totalBeds || 60,
        occupiedBeds: occupiedBeds,
        totalDoctors: data.doctors?.total || mockMetrics.totalDoctors || 12,
        onDutyDoctors: data.doctors?.on_duty || mockMetrics.onDutyDoctors || 4,
        activePatients: activePatients,
        occupiedICUBeds: occupiedICUBeds,

        // Recalculate percentages based on these new values
        bedOccupancy: Math.round((occupiedBeds / (data.capacity_summary?.total_beds || 60)) * 100),
        icuUsage: Math.round((occupiedICUBeds / (data.beds?.icu?.total || 9)) * 100),
        // AQI and Staff Availability might not be in this endpoint, so we default to mock
        // If API provides them later, add them here:
        // aqi: data.aqi ?? mockMetrics.aqi,
        timestamp: new Date(data.timestamp || Date.now())
      };
    } catch (error) {
      console.error('Failed to fetch metrics, using full mock:', error);
      return mockMetrics;
    }
  }

  async getDoctors(): Promise<Doctor[]> {
    const mockDoctors = await this.mockService.getDoctors();
    try {
      const data = await this.fetchJson(`/doctors?hospitalId=${HOSPITAL_ID}`);

      if (!Array.isArray(data)) return mockDoctors;

      // Map API response to Doctor interface
      return data.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        specialization: doc.specialization,
        qualification: doc.qualification,
        isOnDuty: doc.is_on_duty,
        currentPatientCount: doc.current_patient_count,
        maxPatients: doc.max_patients,
        avatar: doc.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
        assistant: 'Assigned Nurse' // API doesn't provide this yet
      }));
    } catch (error) {
      console.error('Failed to fetch doctors, using mock:', error);
      return mockDoctors;
    }
  }

  async getPatients(): Promise<Patient[]> {
    try {
      // Fetch real doctors to assign patients to them
      const doctors = await this.getDoctors();
      const doctorNames = doctors.map(d => d.name);

      // Generate realistic Indian patient data linked to real doctors
      return [
        {
          id: 1,
          name: 'Rajesh Verma',
          age: 45,
          gender: 'Male',
          avatar: 'RV',
          phone: '+91 98765 43210',
          email: 'rajesh.v@email.com',
          address: 'Mumbai, Maharashtra',
          condition: 'Cardiac Arrest',
          status: 'Critical',
          doctor: doctorNames[0] || 'Dr. Amit Patel',
          room: 'ICU-1',
          admitDate: '28 Nov 2024',
          bloodGroup: 'O+',
          lastVisit: '29 Nov 2024',
          vitals: { bp: '140/90', temp: '99.1°F', pulse: '92 bpm', oxygen: '94%' },
          history: [
            { date: '25 Nov 2024', diagnosis: 'Chest Pain', treatment: 'ECG, Observation', doctor: doctorNames[0] || 'Dr. Amit Patel', notes: 'Patient complained of severe chest pain.' },
            { date: '10 Oct 2024', diagnosis: 'Hypertension', treatment: 'Medication Adjustment', doctor: doctorNames[0] || 'Dr. Amit Patel', notes: 'BP higher than normal.' }
          ]
        },
        {
          id: 2,
          name: 'Priya Singh',
          age: 32,
          gender: 'Female',
          avatar: 'PS',
          phone: '+91 98765 43211',
          email: 'priya.s@email.com',
          address: 'Pune, Maharashtra',
          condition: 'Migraine',
          status: 'Stable',
          doctor: doctorNames[1] || 'Dr. Priya Sharma',
          room: 'Gen-101',
          admitDate: '27 Nov 2024',
          bloodGroup: 'B+',
          lastVisit: '29 Nov 2024',
          vitals: { bp: '120/80', temp: '98.4°F', pulse: '72 bpm', oxygen: '98%' },
          history: [
            { date: '20 Nov 2024', diagnosis: 'Headache', treatment: 'Painkillers', doctor: doctorNames[1] || 'Dr. Priya Sharma', notes: 'Recurring migraine.' }
          ]
        },
        {
          id: 3,
          name: 'Amit Kumar',
          age: 55,
          gender: 'Male',
          avatar: 'AK',
          phone: '+91 98765 43212',
          email: 'amit.k@email.com',
          address: 'Thane, Maharashtra',
          condition: 'Diabetes',
          status: 'Stable',
          doctor: doctorNames[2] || 'Dr. Rajesh Kumar',
          room: 'Gen-102',
          admitDate: '25 Nov 2024',
          bloodGroup: 'A+',
          lastVisit: '28 Nov 2024',
          vitals: { bp: '130/85', temp: '98.2°F', pulse: '76 bpm', oxygen: '97%' },
          history: [
            { date: '15 Nov 2024', diagnosis: 'High Blood Sugar', treatment: 'Insulin Adjustment', doctor: doctorNames[2] || 'Dr. Rajesh Kumar', notes: 'Routine checkup.' }
          ]
        },
        {
          id: 4,
          name: 'Sneha Gupta',
          age: 28,
          gender: 'Female',
          avatar: 'SG',
          phone: '+91 98765 43213',
          email: 'sneha.g@email.com',
          address: 'Navi Mumbai, Maharashtra',
          condition: 'Viral Fever',
          status: 'Under Observation',
          doctor: doctorNames[0] || 'Dr. Amit Patel',
          room: 'Gen-103',
          admitDate: '29 Nov 2024',
          bloodGroup: 'AB+',
          lastVisit: '29 Nov 2024',
          vitals: { bp: '110/70', temp: '101.2°F', pulse: '88 bpm', oxygen: '96%' },
          history: []
        },
        {
          id: 5,
          name: 'Rahul Sharma',
          age: 40,
          gender: 'Male',
          avatar: 'RS',
          phone: '+91 98765 43214',
          email: 'rahul.s@email.com',
          address: 'Mumbai, Maharashtra',
          condition: 'Fracture',
          status: 'Stable',
          doctor: doctorNames[1] || 'Dr. Priya Sharma',
          room: 'Ortho-1',
          admitDate: '26 Nov 2024',
          bloodGroup: 'O-',
          lastVisit: '28 Nov 2024',
          vitals: { bp: '125/82', temp: '98.6°F', pulse: '70 bpm', oxygen: '99%' },
          history: [
            { date: '26 Nov 2024', diagnosis: 'Accident', treatment: 'X-Ray, Plaster', doctor: doctorNames[1] || 'Dr. Priya Sharma', notes: 'Bike accident.' }
          ]
        },
        {
          id: 6,
          name: 'Anjali Desai',
          age: 62,
          gender: 'Female',
          avatar: 'AD',
          phone: '+91 98765 43215',
          email: 'anjali.d@email.com',
          address: 'Mumbai, Maharashtra',
          condition: 'Hypertension',
          status: 'Critical',
          doctor: doctorNames[2] || 'Dr. Rajesh Kumar',
          room: 'ICU-2',
          admitDate: '24 Nov 2024',
          bloodGroup: 'B-',
          lastVisit: '29 Nov 2024',
          vitals: { bp: '150/95', temp: '98.8°F', pulse: '80 bpm', oxygen: '95%' },
          history: [
            { date: '20 Nov 2024', diagnosis: 'Dizziness', treatment: 'Observation', doctor: doctorNames[2] || 'Dr. Rajesh Kumar', notes: 'Complained of dizziness.' }
          ],
          reports: [
            { id: 'R-106', name: 'Blood Pressure Log', date: '29 Nov 2024', type: 'Lab', status: 'Ready' }
          ],
          summary: 'Patient admitted for Hypertension. History of Dizziness. Currently Critical with high BP. Requires immediate stabilization.'
        }
      ];
    } catch (error) {
      console.error("Failed to generate patients linked to doctors", error);
      return this.mockService.getPatients();
    }
  }


  async getPatientForecast(days: number = 7): Promise<PatientForecast[]> {
    const mockForecast = await this.mockService.getPatientForecast(days);

    try {
      const data = await this.fetchJson(`/ml/predict/${HOSPITAL_ID}`, {
        method: 'POST'
      });

      const prediction = data.prediction;
      if (!prediction) return mockForecast;

      const forecast: PatientForecast[] = [];
      const today = new Date();

      // The API gives a single day prediction. We'll project this for the requested days
      // with some random variation to simulate a trend for the chart.
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Use the predicted demand as base, add some variation
        const base = prediction.predicted_bed_demand || 100;
        const variation = (Math.random() - 0.5) * 20; // +/- 10

        forecast.push({
          date: date,
          predicted: Math.round(base + variation),
          confidence: Math.round((prediction.confidence || 0.8) * 100),
          eventType: prediction.surge_expected ? 'pollution' : undefined // Simplified mapping
        });
      }

      return forecast;
    } catch (error) {
      console.error('Failed to fetch forecast, using mock:', error);
      return mockForecast;
    }
  }

  async getAlerts(): Promise<Alert[]> {
    const mockAlerts = await this.mockService.getAlerts();

    try {
      // We can derive alerts from the prediction endpoint
      const data = await this.fetchJson(`/ml/predict/${HOSPITAL_ID}`, {
        method: 'POST'
      });

      const alerts: Alert[] = [...mockAlerts]; // Start with mock alerts

      if (data.alert_level && data.alert_level !== 'LOW') {
        alerts.unshift({ // Add real alert to top
          id: 'api-alert-1',
          type: data.alert_level === 'HIGH' ? 'surge' : 'warning',
          message: data.recommendation || 'High demand expected',
          timestamp: new Date(),
          severity: data.alert_level.toLowerCase()
        });
      }

      return alerts;
    } catch (error) {
      console.error('Failed to fetch alerts, using mock:', error);
      return mockAlerts;
    }
  }

  async getRecommendations(): Promise<Recommendation[]> {
    const mockRecs = await this.mockService.getRecommendations();

    try {
      const data = await this.fetchJson(`/ml/predict/${HOSPITAL_ID}`, {
        method: 'POST'
      });

      if (data.recommendation) {
        return [{
          id: 'rec-1',
          category: 'staffing', // Default category
          title: 'AI Recommendation',
          description: data.recommendation,
          priority: data.alert_level === 'HIGH' ? 'high' : 'medium',
          status: 'pending',
          createdAt: new Date()
        }, ...mockRecs];
      }
      return mockRecs;
    } catch (error) {
      console.error('Failed to fetch recommendations, using mock:', error);
      return mockRecs;
    }
  }

  async getExplanations(): Promise<Explanation[]> {
    const mockExplanations = await this.mockService.getExplanations();

    try {
      const data = await this.fetchJson(`/ml/model-data/${HOSPITAL_ID}`);
      const modelData = data.model_data;

      if (!modelData) return mockExplanations;

      return [{
        id: 'exp-1',
        title: 'Prediction Factors',
        details: [
          {
            factor: 'Current Bed Demand',
            value: modelData.current_bed_demand?.toString() || 'N/A',
            impact: 'Direct correlation',
            change: 'Baseline'
          },
          {
            factor: 'AQI',
            value: modelData.aqi?.toString() || 'N/A',
            impact: 'Environmental factor',
            change: modelData.aqi > 100 ? 'High' : 'Normal'
          }
        ],
        confidence: 85,
        sources: [{ name: 'Hospital Data', lastUpdated: new Date() }]
      }, ...mockExplanations];
    } catch (error) {
      console.error('Failed to fetch explanations, using mock:', error);
      return mockExplanations;
    }
  }

  async getSystemStatus(): Promise<SystemStatus> {
    try {
      const metrics = await this.getHospitalMetrics();
      if (metrics.bedOccupancy > 90 || metrics.icuUsage > 90) return 'surge';
      if (metrics.bedOccupancy > 75 || metrics.icuUsage > 75) return 'alert';
      return 'normal';
    } catch (error) {
      return 'normal';
    }
  }

  async addPrescription(patientId: string, prescription: any, consentToken?: string): Promise<any> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (consentToken) {
        headers['X-Consent-Token'] = consentToken;
      }

      const data = await this.fetchJson(`/ehr/patient/${patientId}/prescription`, {
        method: 'POST',
        headers,
        body: JSON.stringify(prescription)
      });
      return data;
    } catch (error) {
      console.error('Failed to add prescription:', error);
      throw error;
    }
  }
}
