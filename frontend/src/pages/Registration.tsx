import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHospital } from '@/contexts/HospitalContext';
import {
  Hospital,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Building,
  FileText,
  CheckCircle,
  Locate,
  Phone,
  Mail,
  User,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HospitalData {
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

const Registration: React.FC = () => {
  const navigate = useNavigate();
  const { setHospitalData: saveHospitalData } = useHospital();
  const [currentStep, setCurrentStep] = useState(1);
  const [hospitalData, setHospitalData] = useState<HospitalData>({
    clinicalRegNo: '',
    hospitalName: '',
    location: {
      address: '',
      area: '',
      pincode: '',
      coordinates: null
    },
    contactInfo: {
      phone: '',
      email: '',
      adminName: ''
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    {
      id: 1,
      title: "Clinical Registration",
      icon: <Shield className="w-5 h-5" />,
      description: "Enter your hospital's official registration number"
    },
    {
      id: 2,
      title: "Hospital Details",
      icon: <Hospital className="w-5 h-5" />,
      description: "Provide hospital name and contact information"
    },
    {
      id: 3,
      title: "Location Setup",
      icon: <MapPin className="w-5 h-5" />,
      description: "Set your hospital location on the map"
    },
    {
      id: 4,
      title: "Ready to Start",
      icon: <CheckCircle className="w-5 h-5" />,
      description: "Complete setup and access your dashboard"
    }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!hospitalData.clinicalRegNo.trim()) {
          newErrors.clinicalRegNo = 'Clinical registration number is required';
        } else if (hospitalData.clinicalRegNo.length < 8) {
          newErrors.clinicalRegNo = 'Registration number must be at least 8 characters';
        }
        break;
      
      case 2:
        if (!hospitalData.hospitalName.trim()) {
          newErrors.hospitalName = 'Hospital name is required';
        }
        if (!hospitalData.contactInfo.adminName.trim()) {
          newErrors.adminName = 'Administrator name is required';
        }
        if (!hospitalData.contactInfo.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(hospitalData.contactInfo.phone)) {
          newErrors.phone = 'Phone number must be 10 digits';
        }
        if (!hospitalData.contactInfo.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(hospitalData.contactInfo.email)) {
          newErrors.email = 'Email is invalid';
        }
        break;
      
      case 3:
        if (!hospitalData.location.address.trim()) {
          newErrors.address = 'Address is required';
        }
        if (!hospitalData.location.area.trim()) {
          newErrors.area = 'Area is required';
        }
        if (!hospitalData.location.pincode.trim()) {
          newErrors.pincode = 'Pincode is required';
        } else if (!/^\d{6}$/.test(hospitalData.location.pincode)) {
          newErrors.pincode = 'Pincode must be 6 digits';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Save hospital data using context
    saveHospitalData(hospitalData);
    
    // Navigate to dashboard
    navigate('/dashboard');
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setHospitalData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              coordinates: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-soft-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinical Registration Number</h2>
              <p className="text-gray-600">
                Enter your hospital's official clinical establishment registration number
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinical Registration Number
              </label>
              <input
                type="text"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                  errors.clinicalRegNo ? "border-red-500" : "border-gray-200"
                )}
                placeholder="e.g., MH/REG/2024/123456"
                value={hospitalData.clinicalRegNo}
                onChange={(e) => setHospitalData(prev => ({ ...prev, clinicalRegNo: e.target.value }))}
              />
              {errors.clinicalRegNo && (
                <p className="text-red-500 text-sm mt-1">{errors.clinicalRegNo}</p>
              )}
            </div>
            
            <div className="bg-soft-blue-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Why do we need this?</h3>
              <p className="text-sm text-gray-600">
                Your clinical registration number ensures compliance with healthcare regulations and verifies your hospital's legitimacy.
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-soft-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Hospital className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Information</h2>
              <p className="text-gray-600">
                Tell us about your hospital and primary contact person
              </p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name
                </label>
                <input
                  type="text"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                    errors.hospitalName ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="e.g., Apollo Hospital"
                  value={hospitalData.hospitalName}
                  onChange={(e) => setHospitalData(prev => ({ ...prev, hospitalName: e.target.value }))}
                />
                {errors.hospitalName && (
                  <p className="text-red-500 text-sm mt-1">{errors.hospitalName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Administrator Name
                </label>
                <input
                  type="text"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                    errors.adminName ? "border-red-500" : "border-gray-200"
                  )}
                  placeholder="e.g., Dr. Rajesh Kumar"
                  value={hospitalData.contactInfo.adminName}
                  onChange={(e) => setHospitalData(prev => ({ 
                    ...prev, 
                    contactInfo: { ...prev.contactInfo, adminName: e.target.value } 
                  }))}
                />
                {errors.adminName && (
                  <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                      errors.phone ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="9876543210"
                    value={hospitalData.contactInfo.phone}
                    onChange={(e) => setHospitalData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, phone: e.target.value } 
                    }))}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                      errors.email ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="admin@hospital.com"
                    value={hospitalData.contactInfo.email}
                    onChange={(e) => setHospitalData(prev => ({ 
                      ...prev, 
                      contactInfo: { ...prev.contactInfo, email: e.target.value } 
                    }))}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-soft-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Location</h2>
              <p className="text-gray-600">
                Provide your hospital's address for accurate regional analytics
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address
                </label>
                <textarea
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors resize-none",
                    errors.address ? "border-red-500" : "border-gray-200"
                  )}
                  rows={3}
                  placeholder="e.g., 123 Medical Complex, Mumbai Central"
                  value={hospitalData.location.address}
                  onChange={(e) => setHospitalData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value } 
                  }))}
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area/District
                  </label>
                  <select
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                      errors.area ? "border-red-500" : "border-gray-200"
                    )}
                    value={hospitalData.location.area}
                    onChange={(e) => setHospitalData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, area: e.target.value } 
                    }))}
                  >
                    <option value="">Select Area</option>
                    <option value="Bandra">Bandra</option>
                    <option value="Andheri">Andheri</option>
                    <option value="Borivali">Borivali</option>
                    <option value="Malad">Malad</option>
                    <option value="Thane">Thane</option>
                    <option value="Navi Mumbai">Navi Mumbai</option>
                    <option value="Kharghar">Kharghar</option>
                    <option value="Vashi">Vashi</option>
                    <option value="Powai">Powai</option>
                    <option value="Mulund">Mulund</option>
                  </select>
                  {errors.area && (
                    <p className="text-red-500 text-sm mt-1">{errors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none transition-colors",
                      errors.pincode ? "border-red-500" : "border-gray-200"
                    )}
                    placeholder="400001"
                    value={hospitalData.location.pincode}
                    onChange={(e) => setHospitalData(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, pincode: e.target.value } 
                    }))}
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-sm mt-1">{errors.pincode}</p>
                  )}
                </div>
              </div>

              <div className="bg-soft-beige-50 border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-700" />
                  Location on Map
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Help us pinpoint your exact location for better regional analytics
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Locate className="w-4 h-4" />
                    Use My Location
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Select on Map
                  </button>
                </div>
                {hospitalData.location.coordinates && (
                  <div className="mt-3 text-sm text-gray-700 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Location captured successfully
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-soft-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
              <p className="text-gray-600">
                Your hospital has been successfully registered with Samruddhi
              </p>
            </div>

            <div className="bg-soft-blue-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-4">Registration Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Hospital Name:</span>
                  <span className="font-medium text-gray-900">{hospitalData.hospitalName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Registration No:</span>
                  <span className="font-medium text-gray-900">{hospitalData.clinicalRegNo}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium text-gray-900">{hospitalData.location.area}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">Administrator:</span>
                  <span className="font-medium text-gray-900">{hospitalData.contactInfo.adminName}</span>
                </div>
              </div>
            </div>

            <div className="bg-soft-green-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Access your personalized dashboard</li>
                <li>• View real-time surge predictions</li>
                <li>• Receive environmental alerts</li>
                <li>• Get AI-powered recommendations</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-soft-beige-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hospital Registration</h1>
            <p className="text-sm text-gray-500">Step {currentStep} of {steps.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pb-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                  currentStep >= step.id
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-200 text-gray-400"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-24 h-1 mx-4 transition-colors duration-300",
                    currentStep > step.id ? "bg-gray-900" : "bg-gray-200"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors border",
              currentStep === 1
                ? "text-gray-400 border-gray-200 cursor-not-allowed"
                : "text-gray-700 border-gray-200 bg-white hover:bg-gray-50"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={isLoading}
            className="group bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Setting up...
              </>
            ) : currentStep === 4 ? (
              <>
                <Hospital className="w-5 h-5" />
                Start Dashboard
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Registration;
