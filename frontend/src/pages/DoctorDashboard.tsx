import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Calendar, Clock, Activity, Search, LogOut, ArrowLeft } from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  appointmentTime: string;
  condition: string;
  status: 'waiting' | 'in-progress' | 'completed';
  lastVisit: string;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctorName = location.state?.doctorName || 'Doctor';
  const [searchQuery, setSearchQuery] = useState('');

  const [patients] = useState<Patient[]>([
    {
      id: 'PT001234',
      name: 'Rajesh Kumar',
      age: 45,
      gender: 'Male',
      appointmentTime: '09:00 AM',
      condition: 'Diabetes Follow-up',
      status: 'waiting',
      lastVisit: '2 weeks ago'
    },
    {
      id: 'PT001235',
      name: 'Priya Sharma',
      age: 32,
      gender: 'Female',
      appointmentTime: '09:30 AM',
      condition: 'Hypertension',
      status: 'waiting',
      lastVisit: '1 month ago'
    },
    {
      id: 'PT001236',
      name: 'Amit Patel',
      age: 28,
      gender: 'Male',
      appointmentTime: '10:00 AM',
      condition: 'General Checkup',
      status: 'waiting',
      lastVisit: 'First Visit'
    },
    {
      id: 'PT001237',
      name: 'Sneha Desai',
      age: 38,
      gender: 'Female',
      appointmentTime: '10:30 AM',
      condition: 'Thyroid Management',
      status: 'waiting',
      lastVisit: '3 weeks ago'
    },
    {
      id: 'PT001238',
      name: 'Vikram Singh',
      age: 52,
      gender: 'Male',
      appointmentTime: '11:00 AM',
      condition: 'Cardiac Review',
      status: 'waiting',
      lastVisit: '1 week ago'
    }
  ]);

  const handlePatientClick = (patient: Patient) => {
    navigate('/patient-otp-verify', {
      state: {
        patientId: patient.id,
        patientName: patient.name,
        doctorName: doctorName
      }
    });
  };

  const handleLogout = () => {
    navigate('/doctors');
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-700';
      case 'in-progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue-100 to-soft-green-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/doctors')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Dr. {doctorName}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Today's Patients</p>
            <p className="text-xl font-semibold text-gray-900">{patients.length}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Waiting</p>
            <p className="text-xl font-semibold text-gray-900">
              {patients.filter(p => p.status === 'waiting').length}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-xl font-semibold text-gray-900">
              {patients.filter(p => p.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">Today's Schedule</h2>
            <p className="text-xs text-gray-500 mt-0.5">Click any patient to view EHR</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handlePatientClick(patient)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center border border-gray-200">
                      <span className="text-xs font-medium text-gray-700">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-gray-900">{patient.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                          {patient.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                        <span>{patient.id}</span>
                        <span>•</span>
                        <span>{patient.age}Y {patient.gender}</span>
                        <span>•</span>
                        <span className="font-semibold text-gray-700">{patient.condition}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{patient.appointmentTime}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{patient.lastVisit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-gray-500">No patients found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
