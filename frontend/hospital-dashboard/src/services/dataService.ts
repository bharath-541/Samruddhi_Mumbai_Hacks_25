import { MockDataService } from './mockDataService';
import { ApiService } from './apiService';

// Define a common interface for both services
export interface IDataService {
    getHospitalMetrics(): Promise<any> | any;
    getPatientForecast(days?: number): Promise<any[]> | any[];
    getAlerts(): Promise<any[]> | any[];
    getRecommendations(): Promise<any[]> | any[];
    getExplanations(): Promise<any[]> | any[];
    getDoctors(): Promise<any[]> | any[];
    getxPatients(): Promise<any[]> | any[];
    getSystemStatus(): Promise<any> | any;
    addPrescription(patientId: string, prescription: any, consentToken?: string): Promise<any>;
}

const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const dataService = useMock
    ? MockDataService.getInstance()
    : ApiService.getInstance();
