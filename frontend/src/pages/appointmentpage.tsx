import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Users, CheckCircle, XCircle, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/dataService';

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Helper to format dates
  const formatDate = (daysAgo: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const [patientDatabase, setPatientDatabase] = useState<any>({});

  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load Patients
        const patients = await dataService.getPatients();
        const db: any = {};
        patients.forEach((p: any) => {
          const id = `P-${10000 + Number(p.id)}`;
          db[id] = {
            name: p.name,
            phone: p.phone,
            lastVisit: p.lastVisit,
            email: p.email,
            address: p.address
          };
        });
        setPatientDatabase(db);

        // Load Doctors
        const fetchedDoctors = await dataService.getDoctors();
        const mappedDoctors = fetchedDoctors.map((d: any) => ({
          id: d.id,
          name: d.name,
          specialty: d.specialization,
          available: d.max_patients ? (d.max_patients - (d.current_patient_count || 0)) : Math.floor(Math.random() * 10) + 1
        }));
        setDoctors(mappedDoctors);

      } catch (error) {
        console.error("Failed to load data", error);
      }
    };
    loadData();
  }, []);

  const timeSlots = [
    { time: '9:00 AM', status: 'available' },
    { time: '9:30 AM', status: 'booked' },
    { time: '10:00 AM', status: 'available' },
    { time: '10:30 AM', status: 'booked' },
    { time: '11:00 AM', status: 'available' },
    { time: '11:30 AM', status: 'available' },
    { time: '2:00 PM', status: 'available' },
    { time: '2:30 PM', status: 'booked' },
    { time: '3:00 PM', status: 'available' },
    { time: '3:30 PM', status: 'available' },
    { time: '4:00 PM', status: 'available' },
    { time: '4:30 PM', status: 'booked' },
  ];

  const todayAppointments = [
    { id: 1, time: '9:00 AM', patientId: 'P-10234', patient: 'Elizabeth Polson', doctor: 'Dr. John Smith', status: 'Checked-in' },
    { id: 2, time: '9:30 AM', patientId: 'P-10123', patient: 'John David', doctor: 'Dr. Joel Anderson', status: 'In Progress' },
    { id: 3, time: '10:00 AM', patientId: 'P-10456', patient: 'Krishtav Rajan', doctor: 'Dr. Joel Anderson', status: 'Waiting' },
    { id: 4, time: '10:30 AM', patientId: 'P-10567', patient: 'Sumanth Tinson', doctor: 'Dr. John Smith', status: 'Completed' },
    { id: 5, time: '11:00 AM', patientId: 'P-10789', patient: 'Baby Kumar', doctor: 'Dr. Emily Chen', status: 'Waiting' },
  ];

  const handlePatientIdSearch = () => {
    const patient = patientDatabase[patientId];
    if (patient) {
      setPatientInfo(patient);
    } else {
      setPatientInfo({ error: 'Patient not found. Please register first.' });
    }
  };

  const handleBookAppointment = () => {
    if (patientInfo && !patientInfo.error && selectedDoctor && selectedSlot) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setPatientId('');
        setPatientInfo(null);
        setSelectedDoctor('');
        setSelectedSlot('');
      }, 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Waiting': return 'bg-soft-blue-100 text-blue-700 border-blue-200';
      case 'Checked-in': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-beige-50 to-soft-blue-50">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-white/80 rounded-lg transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Appointment Booking</h1>
              <p className="text-xs text-gray-600">Reception Counter Interface</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live System
            </div>
          </div>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 shadow-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900 text-sm">✅ Appointment Confirmed!</h3>
              <p className="text-green-700 text-xs mt-1">Token: APT-{Math.random().toString(36).substr(2, 6).toUpperCase()} | Queue: #3</p>
            </div>
            <div className="flex gap-2">
              <button className="text-xs bg-white text-green-700 px-2 py-1 rounded-lg border border-green-200 hover:bg-green-50 transition-colors">
                Print
              </button>
              <button className="text-xs bg-green-600 text-white px-2 py-1 rounded-lg hover:bg-green-700 transition-colors">
                SMS
              </button>
            </div>
          </div>
        )}

        {/* Main Smart Booking Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left: Compact Booking Flow */}
          <div className="lg:col-span-3 space-y-4">

            {/* Smart Patient Search Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                <h3 className="text-sm font-semibold text-gray-900">Patient Lookup</h3>
                <div className="ml-auto text-xs text-gray-500">Step 1/3</div>
              </div>

              {/* Compact Search Interface */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value.toUpperCase())}
                      placeholder="Enter Patient ID (e.g., P-10234)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm font-mono transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handlePatientIdSearch()}
                    />
                  </div>
                  <button
                    onClick={handlePatientIdSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium shadow-sm"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Access Chips */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500 mr-2">Quick:</span>
                  {['P-10234', 'P-10567', 'P-10123'].map((id) => (
                    <button
                      key={id}
                      onClick={() => { setPatientId(id); handlePatientIdSearch(); }}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-blue-100 hover:text-blue-600 transition-all"
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Patient Info */}
              {patientInfo && (
                <div className="mt-3 p-3 rounded-lg border transition-all">
                  {patientInfo.error ? (
                    <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg p-2">
                      <XCircle className="w-4 h-4" />
                      <div className="text-xs">
                        <span className="font-medium">{patientInfo.error}</span>
                        <button className="ml-2 text-blue-600 underline">Register new</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-semibold text-green-700">Patient Verified ✓</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 font-medium">{patientInfo.name}</p>
                          <p className="text-gray-400">{patientId}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{patientInfo.phone}</p>
                          <p className="text-gray-400">Phone</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{patientInfo.lastVisit}</p>
                          <p className="text-gray-400">Last Visit</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Doctors Overview - Similar to Doctors Page */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-900">Today's Doctors</h3>
                <div className="ml-auto text-xs text-gray-500">{doctors.length} Available</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-3 rounded-lg border border-gray-200 hover:shadow-sm transition-all cursor-pointer bg-gradient-to-br from-gray-50 to-white"
                    onClick={() => setSelectedDoctor(doctor.name)}
                  >
                    {/* Doctor Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
                        {doctor.name.split(' ')[1]?.charAt(0)}{doctor.name.split(' ')[2]?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{doctor.name}</h4>
                        <p className="text-xs text-gray-600">{doctor.specialty}</p>
                      </div>
                    </div>

                    {/* Currently Attending - Like in doctors page */}
                    {(doctor.name === 'Dr. John Smith' || doctor.name === 'Dr. Joel Anderson') ? (
                      <div className="mb-2 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-yellow-700 font-medium">Currently Attending</span>
                        </div>
                        <p className="text-xs text-yellow-800 font-semibold mt-1">
                          {doctor.name === 'Dr. John Smith' ? 'Elizabeth Polson' : 'John David'}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-2 p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-xs text-gray-600">No Active Consultation</span>
                        </div>
                      </div>
                    )}

                    {/* Assistant */}
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Assistant: Nurse {doctor.name === 'Dr. John Smith' ? 'Sarah' : doctor.name === 'Dr. Joel Anderson' ? 'Emily' : 'Michael'}</span>
                    </div>

                    {/* Stats */}
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{doctor.available}</span>
                          <span className="text-gray-500 ml-1">Appointments</span>
                        </div>
                        <div>
                          <span className="font-bold text-green-600">{Math.floor(doctor.available / 2)}</span>
                          <span className="text-gray-500 ml-1">Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Doctor Selection */}
            {patientInfo && !patientInfo.error && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-semibold text-gray-900">Select Doctor</h3>
                  <div className="ml-auto text-xs text-gray-500">Step 2/3</div>
                </div>

                {/* Compact Doctor Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      onClick={() => setSelectedDoctor(doctor.name)}
                      className={cn(
                        'p-3 rounded-lg border-2 text-left transition-all text-xs',
                        selectedDoctor === doctor.name
                          ? 'border-purple-300 bg-purple-50 shadow-md'
                          : 'border-gray-200 hover:border-purple-200 bg-white'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center',
                          selectedDoctor === doctor.name ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                        )}>
                          <User className="w-4 h-4" />
                        </div>
                        {selectedDoctor === doctor.name && (
                          <CheckCircle className="w-4 h-4 text-purple-600 ml-auto" />
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm leading-tight">{doctor.name.replace('Dr. ', '')}</h4>
                      <p className="text-xs text-gray-600 mb-1">{doctor.specialty}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">{doctor.available} slots</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Department Filter */}
                <div className="mt-3 flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500 mr-1">Filter:</span>
                  {['Cardio', 'Neuro', 'Pediatric', 'Ortho', 'General'].map((dept) => (
                    <button
                      key={dept}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md hover:bg-purple-100 hover:text-purple-600 transition-all"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Time Slot Selection */}
            {selectedDoctor && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="text-sm font-semibold text-gray-900">Time Slot</h3>
                  <div className="ml-auto text-xs text-gray-500">Step 3/3</div>
                </div>

                {/* Time Period Toggle */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
                  <button className="flex-1 py-1 px-2 bg-white text-gray-700 rounded-md shadow-sm text-xs font-medium">
                    Morning
                  </button>
                  <button className="flex-1 py-1 px-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors">
                    Afternoon
                  </button>
                </div>

                {/* Compact Time Slot Grid */}
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
                  {timeSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.status === 'available' && setSelectedSlot(slot.time)}
                      disabled={slot.status === 'booked'}
                      className={cn(
                        'relative p-2 rounded-lg border text-center transition-all text-xs font-medium',
                        slot.status === 'booked'
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : selectedSlot === slot.time
                            ? 'border-green-400 bg-green-50 text-green-700 shadow-md scale-105'
                            : 'border-gray-200 hover:border-green-300 text-gray-700 bg-white hover:bg-green-50'
                      )}
                    >
                      <div className="font-semibold">{slot.time}</div>
                      {selectedSlot === slot.time && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick Appointment Summary & Book */}
                {selectedSlot && (
                  <div className="space-y-3">
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-gray-900 text-xs">Booking Summary</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="font-semibold text-gray-900">{patientInfo.name}</p>
                          <p className="text-gray-600">{patientId}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedDoctor.split(' ').slice(1, 3).join(' ')}</p>
                          <p className="text-gray-600">{doctors.find(d => d.name === selectedDoctor)?.specialty}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{selectedSlot}</p>
                          <p className="text-gray-600">Today</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleBookAppointment}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-semibold text-sm flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Confirm Booking
                    </button>

                    <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
                      <span>✓ SMS Alert</span>
                      <span>✓ Print Token</span>
                      <span>✓ Queue Update</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Compact Today's Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-4">
              <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-soft-blue-50 to-soft-green-50 rounded-t-xl">
                <h3 className="text-sm font-bold text-gray-900">Today's Queue</h3>
                <p className="text-xs text-gray-600">{formatDate(0)} • Live Updates</p>
              </div>

              <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {todayAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="p-2 bg-gradient-to-br from-soft-blue-50/50 to-white rounded-lg border border-gray-100 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900">{appointment.time}</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(appointment.status)
                      )}>
                        {appointment.status === 'In Progress' ? 'Live' : appointment.status}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-900">{appointment.patient}</span>
                      </div>
                      <p className="text-xs text-gray-500 ml-4">{appointment.patientId}</p>
                      <p className="text-xs text-gray-600 ml-4">{appointment.doctor.replace('Dr. ', 'Dr.')}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact Queue Stats */}
              <div className="p-3 border-t border-gray-200 bg-gradient-to-r from-soft-beige-50/50 to-white rounded-b-xl">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-900">{todayAppointments.length}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">
                      {todayAppointments.filter(a => a.status === 'In Progress').length}
                    </div>
                    <div className="text-xs text-gray-600">Live</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {todayAppointments.filter(a => a.status === 'Waiting').length}
                    </div>
                    <div className="text-xs text-gray-600">Waiting</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <h4 className="text-xs font-semibold text-gray-900 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button className="w-full p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors">
                  + Walk-in Patient
                </button>
                <button className="w-full p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs font-medium transition-colors">
                  📋 View Full Schedule
                </button>
                <button className="w-full p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-medium transition-colors">
                  📞 Emergency Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;
