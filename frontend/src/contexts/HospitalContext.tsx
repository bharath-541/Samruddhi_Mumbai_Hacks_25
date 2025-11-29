import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HospitalData {
  clinicalRegNo: string;
  hospitalName: string;
  location: {
    address: string;
    area: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    } | null;
  };
  contactInfo: {
    phone: string;
    email: string;
    adminName: string;
  };
}

interface HospitalContextType {
  hospitalData: HospitalData | null;
  isRegistered: boolean;
  setHospitalData: (data: HospitalData) => void;
  clearHospitalData: () => void;
}

const defaultHospitalData: HospitalData = {
  clinicalRegNo: 'DEMO/REG/2024/001',
  hospitalName: 'ICONIFY Hospital',
  location: {
    address: 'Kharghar Sector 11, Navi Mumbai',
    area: 'Kharghar',
    pincode: '410210',
    coordinates: {
      lat: 19.0330,
      lng: 73.0297
    }
  },
  contactInfo: {
    phone: '9876543210',
    email: 'admin@iconify-hospital.com',
    adminName: 'Dr. Rajesh Kumar'
  }
};

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

interface HospitalProviderProps {
  children: ReactNode;
}

export const HospitalProvider: React.FC<HospitalProviderProps> = ({ children }) => {
  const [hospitalData, setHospitalDataState] = useState<HospitalData | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    // Load hospital data from localStorage on app start
    const storedData = localStorage.getItem('hospitalData');
    const storedRegistration = localStorage.getItem('isRegistered');
    
    if (storedData && storedRegistration === 'true') {
      try {
        const parsedData = JSON.parse(storedData);
        setHospitalDataState(parsedData);
        setIsRegistered(true);
      } catch (error) {
        console.error('Error parsing stored hospital data:', error);
        // Use default data if parsing fails
        setHospitalDataState(defaultHospitalData);
        setIsRegistered(false);
      }
    } else {
      // Use default data for demo mode
      setHospitalDataState(defaultHospitalData);
      setIsRegistered(false);
    }
  }, []);

  const setHospitalData = (data: HospitalData) => {
    setHospitalDataState(data);
    setIsRegistered(true);
    localStorage.setItem('hospitalData', JSON.stringify(data));
    localStorage.setItem('isRegistered', 'true');
  };

  const clearHospitalData = () => {
    setHospitalDataState(defaultHospitalData);
    setIsRegistered(false);
    localStorage.removeItem('hospitalData');
    localStorage.removeItem('isRegistered');
  };

  return (
    <HospitalContext.Provider
      value={{
        hospitalData,
        isRegistered,
        setHospitalData,
        clearHospitalData
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = (): HospitalContextType => {
  const context = useContext(HospitalContext);
  if (context === undefined) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
