import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Filter, Phone, Mail, MapPin, Calendar, Activity, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

import { dataService } from '@/services/dataService';
import { Patient } from '@/types';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPatient, setSelectedPatient] = useState<number | string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const fetchedPatients = await dataService.getPatients();
        setPatients(fetchedPatients);
      } catch (error) {
        console.error("Failed to load patients", error);
      }
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Stable':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Under Observation':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const stats = [
    { label: 'Total Patients', value: patients.length.toString(), icon: Users, change: 'Active Records' },
    { label: 'Critical Cases', value: patients.filter(p => p.status === 'Critical').length.toString(), icon: AlertCircle, change: 'In ICU' },
    { label: 'Stable Cases', value: patients.filter(p => p.status === 'Stable').length.toString(), icon: Activity, change: 'Regular Ward' },
    { label: 'Under Observation', value: patients.filter(p => p.status === 'Under Observation').length.toString(), icon: Calendar, change: 'Monitoring' },
  ];

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
              <h1 className="text-2xl font-semibold text-gray-900">Patient Directory</h1>
              <p className="text-sm text-gray-600">Manage patient records and information</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
              Add Patient
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </div>
          ))}
        </div>

        {/* Patients List */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Patient Records</h3>
            <p className="text-sm text-gray-600">Click on any patient to view details</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {patients.map((patient) => (
                <div key={patient.id} className="space-y-0">
                  {/* Patient Card */}
                  <div
                    className="flex items-center gap-4 p-4 bg-gradient-to-br from-soft-blue-50 to-soft-green-50 rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelectedPatient(selectedPatient === patient.id ? null : patient.id)}
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-soft-blue-100 to-soft-green-100 flex items-center justify-center text-gray-700 font-bold text-lg flex-shrink-0">
                      {patient.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-semibold text-gray-900">{patient.name}</h4>
                        <span className="text-xs text-gray-600">• {patient.age}yrs • {patient.gender}</span>
                      </div>
                      <div className="text-sm text-gray-600">{patient.condition}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Dr: {patient.doctor} • Room: {patient.room}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border",
                        getStatusColor(patient.status)
                      )}>
                        {patient.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedPatient === patient.id && (
                    <div className="ml-4 mr-4 mb-3 p-6 bg-white border border-gray-200 rounded-lg shadow-sm space-y-6">
                      {/* Contact Information */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-gray-200">
                            <Phone className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="text-xs text-gray-500">Phone</div>
                              <div className="text-sm text-gray-900">{patient.phone}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-gray-200">
                            <Mail className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="text-xs text-gray-500">Email</div>
                              <div className="text-sm text-gray-900 truncate">{patient.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-gray-200 md:col-span-2">
                            <MapPin className="w-4 h-4 text-gray-600" />
                            <div>
                              <div className="text-xs text-gray-500">Address</div>
                              <div className="text-sm text-gray-900">{patient.address}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Medical Information</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-gradient-to-br from-soft-green-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Blood Group</div>
                            <div className="text-lg font-bold text-gray-900">{patient.bloodGroup}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-green-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Admit Date</div>
                            <div className="text-sm font-medium text-gray-900">{patient.admitDate}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-green-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Last Visit</div>
                            <div className="text-sm font-medium text-gray-900">{patient.lastVisit}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-green-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Room</div>
                            <div className="text-lg font-bold text-gray-900">{patient.room}</div>
                          </div>
                        </div>
                      </div>

                      {/* Vitals */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 mb-3">Latest Vitals</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-3 bg-gradient-to-br from-soft-purple-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Blood Pressure</div>
                            <div className="text-lg font-bold text-gray-900">{patient.vitals.bp}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-purple-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Temperature</div>
                            <div className="text-lg font-bold text-gray-900">{patient.vitals.temp}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-purple-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Pulse Rate</div>
                            <div className="text-lg font-bold text-gray-900">{patient.vitals.pulse}</div>
                          </div>
                          <div className="p-3 bg-gradient-to-br from-soft-purple-50 to-white rounded-lg border border-gray-200">
                            <div className="text-xs text-gray-500">Oxygen Level</div>
                            <div className="text-lg font-bold text-gray-900">{patient.vitals.oxygen}</div>
                          </div>
                        </div>
                      </div>

                      {/* Medical History */}
                      {patient.history && patient.history.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Medical History</h5>
                          <div className="space-y-3">
                            {patient.history.map((record, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-900">{record.diagnosis}</span>
                                  <span className="text-xs text-gray-500">{record.date}</span>
                                </div>
                                <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Treatment:</span> {record.treatment}</p>
                                <p className="text-xs text-gray-500 italic">"{record.notes}" - {record.doctor}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reports */}
                      {patient.reports && patient.reports.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 mb-3">Medical Reports</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {patient.reports.map((report, idx) => (
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

                      {/* Smart Summary Widget */}
                      {patient.summary && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-600" />
                            <h5 className="text-sm font-bold text-purple-900">AI Patient Summary</h5>
                          </div>
                          <p className="text-sm text-purple-800 leading-relaxed">
                            {patient.summary}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm">
                          View Full Record
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          Schedule Appointment
                        </button>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                          Contact
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsPage;
