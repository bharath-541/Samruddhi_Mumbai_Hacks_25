import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  MapPin,
  Activity,
  FileText,
  Plus,
  Pill,
  Heart,
  Droplet,
  Thermometer,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { dataService } from '@/services/dataService';

interface MedicalRecord {
  date: string;
  diagnosis: string;
  doctor: string;
  prescription: string[];
}

interface VitalSign {
  label: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

const PatientEHR: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientName = location.state?.patientName || 'Patient';
  const patientId = location.state?.patientId || '';
  const doctorName = location.state?.doctorName || 'Doctor';

  const [showAddPrescription, setShowAddPrescription] = useState(false);

  // Mock patient data for fallback
  const patientInfo = {
    name: patientName,
    id: patientId,
    age: 45,
    gender: 'Male',
    bloodGroup: 'O+',
    phone: '+91 98765 43210',
    address: 'Mumbai, Maharashtra',
    emergencyContact: '+91 98765 43211'
  };

  const vitalSigns: VitalSign[] = [
    {
      label: 'Blood Pressure',
      value: '120/80',
      unit: 'mmHg',
      status: 'normal',
      icon: <Heart className="w-5 h-5" />
    },
    {
      label: 'Heart Rate',
      value: '72',
      unit: 'bpm',
      status: 'normal',
      icon: <Activity className="w-5 h-5" />
    },
    {
      label: 'Temperature',
      value: '98.6',
      unit: '°F',
      status: 'normal',
      icon: <Thermometer className="w-5 h-5" />
    },
    {
      label: 'Blood Sugar',
      value: '95',
      unit: 'mg/dL',
      status: 'normal',
      icon: <Droplet className="w-5 h-5" />
    }
  ];

  const medicalHistory: MedicalRecord[] = [
    {
      date: '15 Nov 2024',
      diagnosis: 'Diabetes Type 2 - Routine Checkup',
      doctor: 'Dr. Sharma',
      prescription: ['Metformin 500mg - 2 times daily', 'Glimepiride 1mg - Once daily']
    },
    {
      date: '01 Nov 2024',
      diagnosis: 'Hypertension Management',
      doctor: 'Dr. Patel',
      prescription: ['Amlodipine 5mg - Once daily', 'Lifestyle modifications advised']
    },
    {
      date: '10 Oct 2024',
      diagnosis: 'Annual Health Checkup',
      doctor: 'Dr. Kumar',
      prescription: ['All parameters within normal range', 'Continue current medications']
    }
  ];

  const allergies = ['Penicillin', 'Aspirin'];
  const chronicConditions = ['Type 2 Diabetes', 'Hypertension'];

  // Mock Reports for fallback
  const mockReports = [
    { name: 'Blood Count', date: '15 Nov 2024', type: 'Lab' },
    { name: 'Chest X-Ray', date: '01 Nov 2024', type: 'Radiology' }
  ];

  // Mock Summary for fallback
  const mockSummary = "Patient has a history of Type 2 Diabetes and Hypertension. Recent blood sugar levels are stable (95 mg/dL). Adherence to medication (Metformin, Glimepiride) is good. BP is well-controlled (120/80). Recommended to continue current lifestyle modifications and follow up in 3 months.";

  const getVitalStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const patients = await dataService.getPatients();
        // Find patient by ID (handling P- prefix if needed)
        const foundPatient = patients.find((p: any) =>
          p.id === patientId || `P-${10000 + Number(p.id)}` === patientId || p.id.toString() === patientId
        );

        if (foundPatient) {
          setPatient(foundPatient);
        }
      } catch (error) {
        console.error("Failed to load patient data", error);
      }
    };
    loadData();
  }, [patientId]);

  // Use real patient data if available, otherwise fallback to mock (or empty)
  const displayPatient = patient || patientInfo;
  const displayReports = patient?.reports || mockReports;
  const displaySummary = patient?.summary || mockSummary;

  const currentVitals: VitalSign[] = patient ? [
    {
      label: 'Blood Pressure',
      value: patient.vitals.bp,
      unit: 'mmHg',
      status: 'normal',
      icon: <Heart className="w-5 h-5" />
    },
    {
      label: 'Heart Rate',
      value: patient.vitals.pulse.replace(' bpm', ''),
      unit: 'bpm',
      status: 'normal',
      icon: <Activity className="w-5 h-5" />
    },
    {
      label: 'Temperature',
      value: patient.vitals.temp.replace('°F', ''),
      unit: '°F',
      status: 'normal',
      icon: <Thermometer className="w-5 h-5" />
    },
    {
      label: 'Oxygen Level',
      value: patient.vitals.oxygen.replace('%', ''),
      unit: '%',
      status: 'normal',
      icon: <Droplet className="w-5 h-5" />
    }
  ] : vitalSigns;

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue-100 to-soft-green-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center border border-gray-200">
                <div className="text-2xl font-bold text-gray-700">{displayPatient.avatar || <User className="w-8 h-8" />}</div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{displayPatient.name}</h1>
                <p className="text-sm text-gray-600">Patient ID: {patientId} • Viewing as Dr. {doctorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddPrescription(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Prescription</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Mark this consultation as completed?')) {
                    alert('Patient consultation completed successfully!');
                    navigate('/doctor-dashboard', {
                      state: { doctorName: doctorName }
                    });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Mark as Completed</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-sm font-medium text-gray-900">{displayPatient.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium text-gray-900">{displayPatient.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-sm font-medium text-gray-900">{displayPatient.bloodGroup}</p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Phone className="w-4 h-4" />
                    <span>{displayPatient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{displayPatient.address}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-semibold text-gray-900">Allergies</h2>
              </div>
              <div className="space-y-2">
                {allergies.map((allergy, index) => (
                  <div key={index} className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-700">{allergy}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Chronic Conditions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Chronic Conditions</h2>
              <div className="space-y-2">
                {chronicConditions.map((condition, index) => (
                  <div key={index} className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-700">{condition}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Medical Records */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vital Signs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Latest Vital Signs</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {currentVitals.map((vital, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getVitalStatusColor(vital.status)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {vital.icon}
                      <p className="text-xs font-medium">{vital.label}</p>
                    </div>
                    <p className="text-lg font-bold">{vital.value}</p>
                    <p className="text-xs">{vital.unit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Last updated: Today, 9:00 AM</span>
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900">Medical History</h2>
                <p className="text-sm text-gray-600 mt-1">Recent consultations and prescriptions</p>
              </div>
              <div className="divide-y divide-gray-200">
                {patient && patient.history ? (
                  patient.history.map((record: any, index: number) => (
                    <div key={index} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{record.diagnosis}</h3>
                          <p className="text-xs text-gray-500 mt-1">Dr. {record.doctor}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{record.date}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Treatment / Notes:</p>
                        <p className="text-sm text-gray-600">{record.treatment}</p>
                        <p className="text-xs text-gray-500 italic mt-1">"{record.notes}"</p>
                      </div>
                    </div>
                  ))
                ) : (
                  medicalHistory.map((record, index) => (
                    <div key={index} className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{record.diagnosis}</h3>
                          <p className="text-xs text-gray-500 mt-1">Dr. {record.doctor}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{record.date}</span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs font-medium text-gray-700 mb-2">Prescription:</p>
                        <ul className="space-y-1">
                          {record.prescription.map((med, medIndex) => (
                            <li key={medIndex} className="text-sm text-gray-600 flex items-start gap-2">
                              <Pill className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                              <span>{med}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Medical Reports */}
            {displayReports && displayReports.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900">Medical Reports</h2>
                  <p className="text-sm text-gray-600 mt-1">Lab results and imaging</p>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayReports.map((report: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.name}</div>
                          <div className="text-xs text-gray-500">{report.date} • {report.type}</div>
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Patient Summary */}
            {displaySummary && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-purple-900">AI Patient Summary</h2>
                </div>
                <p className="text-sm text-purple-800 leading-relaxed">
                  {displaySummary}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Prescription Modal */}
      {showAddPrescription && (
        <AddPrescriptionModal
          patientName={patientInfo.name}
          patientId={patientInfo.id}
          doctorName={doctorName}
          onClose={() => setShowAddPrescription(false)}
        />
      )}
    </div>
  );
};

// Add Prescription Modal Component
interface AddPrescriptionModalProps {
  patientName: string;
  patientId: string;
  doctorName: string;
  onClose: () => void;
}

const AddPrescriptionModal: React.FC<AddPrescriptionModalProps> = ({
  patientName,
  patientId,
  doctorName,
  onClose
}) => {
  const [formData, setFormData] = useState({
    diagnosis: '',
    symptoms: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
    followUp: '',
    consentToken: ''
  });

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    });
  };

  const removeMedicine = (index: number) => {
    const newMedicines = formData.medicines.filter((_, i) => i !== index);
    setFormData({ ...formData, medicines: newMedicines });
  };

  const updateMedicine = (index: number, field: string, value: string) => {
    const newMedicines = [...formData.medicines];
    newMedicines[index] = { ...newMedicines[index], [field]: value };
    setFormData({ ...formData, medicines: newMedicines });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.consentToken) {
        alert('Please enter the Patient Consent Token');
        return;
      }

      // Format payload according to API schema
      const prescriptionPayload = {
        date: new Date().toISOString(),
        doctor_name: doctorName,
        hospital_name: 'Apollo Hospital', // Should ideally come from context/env
        medications: formData.medicines.map(med => ({
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        })),
        diagnosis: formData.diagnosis,
        notes: formData.instructions
      };

      await dataService.addPrescription(patientId, prescriptionPayload, formData.consentToken);

      alert('Prescription added successfully!');
      onClose();
      // Ideally trigger a refresh of patient data here
    } catch (error) {
      console.error('Error adding prescription:', error);
      // Fallback for demo/deployment as requested
      alert('Prescription added successfully (mock)!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add Prescription</h2>
              <p className="text-sm text-gray-600 mt-1">
                For {patientName} (ID: {patientId})
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis / Cause <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="e.g., Acute Bronchitis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Symptoms
            </label>
            <textarea
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="Describe patient symptoms..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Medicines <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addMedicine}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {formData.medicines.map((medicine, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Medicine {index + 1}</span>
                    {formData.medicines.length > 1 && (
                      <button
                        onClick={() => removeMedicine(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <select
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Thrice daily">Thrice daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed">As needed</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Duration (e.g., 7 days)"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Any special instructions for the patient..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Follow-up */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date
            </label>
            <input
              type="date"
              value={formData.followUp}
              onChange={(e) => setFormData({ ...formData, followUp: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Consent Token */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block text-sm font-medium text-blue-900 mb-2">
            Patient Consent Token <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-blue-700 mb-2">
            Please ask the patient to share their consent token from the mobile app.
          </p>
          <input
            type="text"
            value={formData.consentToken}
            onChange={(e) => setFormData({ ...formData, consentToken: e.target.value })}
            placeholder="Paste Consent Token here..."
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Save Prescription
        </button>
      </div>
    </div>
  );
};

export default PatientEHR;
