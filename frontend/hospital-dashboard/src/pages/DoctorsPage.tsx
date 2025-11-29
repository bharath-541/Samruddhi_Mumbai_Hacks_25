import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/dataService';
import { Doctor } from '@/types';

const DoctorsPage: React.FC = () => {
  const navigate = useNavigate();
  const getNextDays = (count: number) => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < count; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    }
    return days;
  };

  const dates = getNextDays(5);
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedDoctors = await dataService.getDoctors();
        const fetchedPatients = await dataService.getPatients();

        // Enhance doctor data with real patients
        const enhancedDoctors = fetchedDoctors.map((doc: Doctor) => {
          // Find patients assigned to this doctor
          // Note: Mock patients have hardcoded doctor names. 
          // If using real API doctors, names might not match exactly, so we might need fuzzy match or just distribute.
          // For now, we filter by exact name match or distribute if none found.

          let docPatients = fetchedPatients.filter((p: any) => p.doctor === doc.name);

          // If no patients assigned (e.g. name mismatch), assign some random ones for demo
          if (docPatients.length === 0) {
            docPatients = fetchedPatients.filter((_, i) => i % fetchedDoctors.length === fetchedDoctors.indexOf(doc));
          }

          return {
            ...doc,
            currentlyAttending: doc.isOnDuty ? (docPatients[0]?.name || 'Available') : null,
            patients: docPatients.map((p: any) => ({
              id: p.id,
              patientId: `P-${10000 + Number(p.id)}`,
              name: p.name,
              status: p.status === 'Critical' ? 'Attending' : 'Scheduled',
              time: p.lastVisit || 'Today'
            }))
          };
        });

        setDoctors(enhancedDoctors);
      } catch (error) {
        console.error("Failed to load doctors", error);
      }
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Attending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Scheduled':
        return 'bg-soft-blue-100 text-blue-700 border-blue-200';
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDoctorClick = (doctor: typeof doctors[0]) => {
    navigate('/doctor-login', {
      state: {
        doctorName: doctor.name.replace('Dr. ', ''),
        doctorId: `DOC${doctor.id.toString().padStart(3, '0')}`,
        specialty: doctor.specialty
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue-100 to-soft-green-100">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Doctor's Schedule</h1>
              <p className="text-sm text-gray-600">View appointments and patient assignments</p>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">Select Date</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {dates.map((date) => (
              <button
                key={date}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                  selectedDate === date
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {date}
              </button>
            ))}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm"
            >
              {/* Doctor Header */}
              <div
                className="p-5 border-b border-gray-200 bg-gradient-to-br from-soft-beige-50 to-white cursor-pointer hover:bg-gradient-to-br hover:from-soft-blue-50 hover:to-soft-green-50 transition-colors"
                onClick={() => handleDoctorClick(doctor)}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-soft-blue-100 to-soft-green-100 flex items-center justify-center text-gray-700 font-bold text-lg flex-shrink-0">
                    {doctor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900">{doctor.name}</h3>
                    <p className="text-xs text-gray-600">{doctor.specialty}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>

                {/* Currently Attending */}
                {doctor.currentlyAttending ? (
                  <div className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                      <span className="text-xs font-semibold text-yellow-700">Currently Attending</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{doctor.currentlyAttending}</p>
                  </div>
                ) : (
                  <div className="mb-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-xs font-medium text-gray-600">No Active Consultation</span>
                    </div>
                  </div>
                )}

                {/* Assistant */}
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Assistant: {doctor.assistant}</span>
                </div>
              </div>

              {/* Patient List */}
              <div className="p-4">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center justify-between">
                  <span>Patient Details</span>
                  <span>Status</span>
                </div>
                <div className="space-y-2">
                  {doctor.patients.map((patient: any) => (
                    <div
                      key={patient.id}
                      className="flex items-center justify-between p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                            {patient.patientId}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{patient.time}</div>
                      </div>
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap',
                        getStatusColor(patient.status)
                      )}>
                        {patient.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Stats */}
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-3 bg-gradient-to-br from-soft-green-50 to-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">{doctor.patients.length}</div>
                    <div className="text-xs text-gray-600">Appointments</div>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-soft-purple-50 to-white rounded-lg border border-gray-200">
                    <div className="text-lg font-bold text-gray-900">
                      {doctor.patients.filter((p: any) => p.status === 'Completed').length}
                    </div>
                    <div className="text-xs text-gray-600">Completed</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
