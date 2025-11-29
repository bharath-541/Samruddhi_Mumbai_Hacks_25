export interface DiseaseData {
  id: string;
  name: string;
  category: 'respiratory' | 'gastrointestinal' | 'vector-borne' | 'infectious' | 'seasonal';
  currentCases: number;
  weeklyChange: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  symptoms: string[];
  affectedAgeGroups: string[];
  recommendedActions: string[];
  lastUpdated: Date;
}

export interface DiseaseTimeSeriesData {
  date: Date;
  cases: number;
  diseaseId: string;
}

export interface RegionalAlert {
  id: string;
  title: string;
  description: string;
  region: string;
  alertLevel: 'info' | 'warning' | 'critical';
  diseaseName: string;
  activeSince: Date;
  estimatedDuration: number; // days
}

export class DiseaseSurgeService {
  private static instance: DiseaseSurgeService;

  public static getInstance(): DiseaseSurgeService {
    if (!DiseaseSurgeService.instance) {
      DiseaseSurgeService.instance = new DiseaseSurgeService();
    }
    return DiseaseSurgeService.instance;
  }

  private getDiseasesByCategory() {
    return {
      respiratory: ['Influenza', 'COVID-19', 'RSV', 'Pneumonia', 'Bronchitis'],
      gastrointestinal: ['Gastroenteritis', 'Food Poisoning', 'Norovirus', 'Rotavirus'],
      'vector-borne': ['Dengue', 'Malaria', 'Chikungunya', 'Zika'],
      infectious: ['Tuberculosis', 'Hepatitis A', 'Measles', 'Chickenpox'],
      seasonal: ['Seasonal Allergies', 'Heat Stroke', 'Dehydration']
    };
  }

  public getCurrentDiseaseData(): DiseaseData[] {
    const diseases = this.getDiseasesByCategory();
    const allDiseases: DiseaseData[] = [];

    Object.entries(diseases).forEach(([category, diseaseList]) => {
      diseaseList.forEach((disease, index) => {
        const baseCases = Math.round(10 + Math.random() * 100);

        // Correlate change with cases: High cases should generally show an upward trend (surge)
        // to match user expectations of a "Surge Alert"
        let minChange = -20;
        let maxChange = 40;

        if (baseCases > 50) {
          // For High/Critical cases, bias towards positive growth (surge)
          minChange = 5;
          maxChange = 50;
        } else if (baseCases < 30) {
          // For Low cases, bias towards negative or low growth
          minChange = -30;
          maxChange = 10;
        }

        const weeklyChange = Math.round(minChange + Math.random() * (maxChange - minChange));

        let severity: DiseaseData['severity'];
        if (baseCases > 80) severity = 'critical';
        else if (baseCases > 50) severity = 'high';
        else if (baseCases > 25) severity = 'moderate';
        else severity = 'low';

        allDiseases.push({
          id: `${category}-${index}`,
          name: disease,
          category: category as DiseaseData['category'],
          currentCases: baseCases,
          weeklyChange,
          severity,
          description: this.getDiseaseDescription(disease),
          symptoms: this.getDiseaseSymptoms(disease),
          affectedAgeGroups: this.getAffectedAgeGroups(disease),
          recommendedActions: this.getRecommendedActions(disease),
          lastUpdated: new Date()
        });
      });
    });

    return allDiseases.sort((a, b) => b.currentCases - a.currentCases);
  }

  public getDiseaseTimeSeriesData(diseaseId: string, days: number = 30): DiseaseTimeSeriesData[] {
    const data: DiseaseTimeSeriesData[] = [];
    const baseValue = 20 + Math.random() * 50;

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const variation = Math.sin((i / days) * Math.PI * 2) * 15;
      const randomNoise = (Math.random() - 0.5) * 10;
      const cases = Math.max(0, Math.round(baseValue + variation + randomNoise));

      data.push({
        date,
        cases,
        diseaseId
      });
    }

    return data;
  }

  public getRegionalAlerts(): RegionalAlert[] {
    const alerts: RegionalAlert[] = [
      {
        id: 'alert-1',
        title: 'Dengue Outbreak Warning',
        description: 'Increased dengue cases reported in Kharghar and surrounding areas due to recent rainfall.',
        region: 'Navi Mumbai',
        alertLevel: 'warning',
        diseaseName: 'Dengue',
        activeSince: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        estimatedDuration: 14
      },
      {
        id: 'alert-2',
        title: 'Seasonal Flu Surge',
        description: 'Higher than usual influenza cases due to changing weather patterns.',
        region: 'Mumbai Metropolitan',
        alertLevel: 'info',
        diseaseName: 'Influenza',
        activeSince: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        estimatedDuration: 21
      }
    ];

    if (Math.random() > 0.7) {
      alerts.push({
        id: 'alert-3',
        title: 'Food Poisoning Cases',
        description: 'Cluster of gastroenteritis cases possibly linked to contaminated water supply.',
        region: 'Sector 11, Kharghar',
        alertLevel: 'critical',
        diseaseName: 'Gastroenteritis',
        activeSince: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        estimatedDuration: 7
      });
    }

    return alerts;
  }

  public getSeverityColor(severity: DiseaseData['severity']): string {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
    }
  }

  public getAlertLevelColor(level: RegionalAlert['alertLevel']): string {
    switch (level) {
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    }
  }

  private getDiseaseDescription(disease: string): string {
    const descriptions: Record<string, string> = {
      'Dengue': 'Vector-borne viral infection transmitted by Aedes mosquitoes, common during monsoon season.',
      'Influenza': 'Seasonal respiratory illness affecting upper respiratory tract.',
      'COVID-19': 'Coronavirus disease causing respiratory and systemic symptoms.',
      'Gastroenteritis': 'Inflammation of stomach and intestines causing digestive issues.',
      'Malaria': 'Parasitic infection transmitted through infected mosquito bites.',
      'Tuberculosis': 'Bacterial infection primarily affecting the lungs.',
    };
    return descriptions[disease] || 'Common infectious disease requiring medical attention.';
  }

  private getDiseaseSymptoms(disease: string): string[] {
    const symptoms: Record<string, string[]> = {
      'Dengue': ['High fever', 'Severe headache', 'Body aches', 'Nausea', 'Skin rash'],
      'Influenza': ['Fever', 'Cough', 'Body aches', 'Fatigue', 'Sore throat'],
      'COVID-19': ['Fever', 'Cough', 'Shortness of breath', 'Loss of taste/smell'],
      'Gastroenteritis': ['Nausea', 'Vomiting', 'Diarrhea', 'Abdominal cramps', 'Dehydration'],
    };
    return symptoms[disease] || ['Fever', 'Fatigue', 'General discomfort'];
  }

  private getAffectedAgeGroups(disease: string): string[] {
    const ageGroups: Record<string, string[]> = {
      'Dengue': ['All ages', 'Higher risk: Children & elderly'],
      'Influenza': ['All ages', 'Higher risk: >65 years, <5 years'],
      'COVID-19': ['All ages', 'Higher risk: >60 years'],
      'Gastroenteritis': ['All ages', 'Higher risk: Children & elderly'],
    };
    return ageGroups[disease] || ['All age groups'];
  }

  private getRecommendedActions(disease: string): string[] {
    const actions: Record<string, string[]> = {
      'Dengue': ['Eliminate stagnant water', 'Use mosquito repellent', 'Seek immediate medical care for fever'],
      'Influenza': ['Get vaccinated', 'Practice good hygiene', 'Stay home when sick', 'Wear masks in crowded places'],
      'COVID-19': ['Get vaccinated', 'Wear masks', 'Maintain social distance', 'Practice hand hygiene'],
      'Gastroenteritis': ['Stay hydrated', 'Eat bland foods', 'Practice good hygiene', 'Avoid contaminated food/water'],
    };
    return actions[disease] || ['Seek medical attention', 'Practice good hygiene', 'Follow health guidelines'];
  }
}
