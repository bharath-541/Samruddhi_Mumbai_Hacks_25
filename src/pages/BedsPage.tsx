import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bed, Users, CheckCircle, XCircle, Clock, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/dataService';
import { HospitalMetrics } from '@/types';

const BedsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [metrics, setMetrics] = useState<HospitalMetrics | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const data = await dataService.getHospitalMetrics();
      setMetrics(data);
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Distribute real metrics across room types
  const totalRealBeds = metrics?.totalBeds || 60;
  const totalRealOccupied = metrics?.occupiedBeds || 0;

  // Distribution ratios: Executive (15%), Premium (35%), Basic (50%)
  const execBeds = Math.round(totalRealBeds * 0.15);
  const premBeds = Math.round(totalRealBeds * 0.35);
  const basicBeds = totalRealBeds - execBeds - premBeds;

  const execOcc = Math.round(totalRealOccupied * 0.15);
  const premOcc = Math.round(totalRealOccupied * 0.35);
  const basicOcc = totalRealOccupied - execOcc - premOcc;

  const roomTypes = [
    {
      id: 'executive',
      name: 'Executive Room',
      totalBeds: execBeds,
      occupied: execOcc,
      available: execBeds - execOcc,
      color: 'from-soft-purple-100 to-soft-pink-100',
      rooms: [
        { number: 'E101', status: 'occupied', patient: 'John Doe', admitDate: '15 Nov', condition: 'Surgery Recovery' },
        { number: 'E102', status: 'occupied', patient: 'Jane Smith', admitDate: '16 Nov', condition: 'Cardiac Care' },
        { number: 'E103', status: 'available', patient: null, admitDate: null, condition: null },
        { number: 'E104', status: 'occupied', patient: 'Bob Wilson', admitDate: '14 Nov', condition: 'Post-Op' },
        { number: 'E105', status: 'maintenance', patient: null, admitDate: null, condition: null },
      ]
    },
    {
      id: 'premium',
      name: 'Premium Room',
      totalBeds: premBeds,
      occupied: premOcc,
      available: premBeds - premOcc,
      color: 'from-soft-blue-100 to-soft-teal-100',
      rooms: [
        { number: 'P201', status: 'occupied', patient: 'Sarah Lee', admitDate: '17 Nov', condition: 'Diabetes Management' },
        { number: 'P202', status: 'available', patient: null, admitDate: null, condition: null },
        { number: 'P203', status: 'occupied', patient: 'Michael Brown', admitDate: '15 Nov', condition: 'Hypertension' },
        { number: 'P204', status: 'occupied', patient: 'Emily Davis', admitDate: '18 Nov', condition: 'Observation' },
        { number: 'P205', status: 'available', patient: null, admitDate: null, condition: null },
        { number: 'P206', status: 'occupied', patient: 'David Chen', admitDate: '16 Nov', condition: 'Recovery' },
      ]
    },
    {
      id: 'basic',
      name: 'Basic Room',
      totalBeds: basicBeds,
      occupied: basicOcc,
      available: basicBeds - basicOcc,
      color: 'from-soft-green-100 to-soft-yellow-100',
      rooms: [
        { number: 'B301', status: 'occupied', patient: 'Ram Kumar', admitDate: '17 Nov', condition: 'Fever' },
        { number: 'B302', status: 'occupied', patient: 'Priya Sharma', admitDate: '16 Nov', condition: 'Infection' },
        { number: 'B303', status: 'available', patient: null, admitDate: null, condition: null },
        { number: 'B304', status: 'occupied', patient: 'Amit Patel', admitDate: '15 Nov', condition: 'General Care' },
        { number: 'B305', status: 'occupied', patient: 'Neha Singh', admitDate: '18 Nov', condition: 'Observation' },
        { number: 'B306', status: 'available', patient: null, admitDate: null, condition: null },
        { number: 'B307', status: 'occupied', patient: 'Raj Verma', admitDate: '17 Nov', condition: 'Recovery' },
      ]
    },
  ];

  const totalBeds = roomTypes.reduce((acc, room) => acc + room.totalBeds, 0);
  const totalOccupied = roomTypes.reduce((acc, room) => acc + room.occupied, 0);
  const totalAvailable = roomTypes.reduce((acc, room) => acc + room.available, 0);
  const occupancyRate = Math.round((totalOccupied / totalBeds) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'available':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return <XCircle className="w-4 h-4" />;
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'maintenance':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-semibold text-gray-900">Bed Management</h1>
              <p className="text-sm text-gray-600">Track and manage hospital bed availability</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search room..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Bed className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">Total Beds</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalBeds}</div>
            <p className="text-xs text-gray-500 mt-1">All room types</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-600 font-medium">Occupied</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalOccupied}</div>
            <p className="text-xs text-gray-500 mt-1">Currently in use</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">Available</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalAvailable}</div>
            <p className="text-xs text-gray-500 mt-1">Ready for admission</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600 font-medium">Occupancy Rate</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{occupancyRate}%</div>
            <p className="text-xs text-gray-500 mt-1">Current capacity</p>
          </div>
        </div>

        {/* Room Type Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {roomTypes.map((roomType) => (
            <div key={roomType.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Room Type Header */}
              <div className={cn("p-6 bg-gradient-to-br rounded-t-lg", roomType.color)}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{roomType.name}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-white">
                    <div className="text-xl font-bold text-gray-900">{roomType.totalBeds}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-white">
                    <div className="text-xl font-bold text-red-600">{roomType.occupied}</div>
                    <div className="text-xs text-gray-600">Occupied</div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-white">
                    <div className="text-xl font-bold text-green-600">{roomType.available}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                </div>
              </div>

              {/* Room List */}
              <div className="p-6 space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Rooms</h4>
                  <button
                    onClick={() => setSelectedRoom(selectedRoom === roomType.id ? null : roomType.id)}
                    className="text-xs text-gray-600 hover:text-gray-900"
                  >
                    {selectedRoom === roomType.id ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                {roomType.rooms
                  .slice(0, selectedRoom === roomType.id ? undefined : 3)
                  .map((room, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-br from-soft-blue-50 to-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-gray-700 font-semibold text-sm border border-gray-200 flex-shrink-0">
                        {room.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        {room.status === 'occupied' ? (
                          <>
                            <div className="text-sm font-medium text-gray-900 truncate">{room.patient}</div>
                            <div className="text-xs text-gray-600">{room.condition}</div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {room.status === 'maintenance' ? 'Under Maintenance' : 'Ready for admission'}
                          </div>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1",
                          getStatusColor(room.status)
                        )}>
                          {getStatusIcon(room.status)}
                          <span className="capitalize">{room.status}</span>
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Footer Action */}
              <div className="border-t border-gray-200 p-4">
                <button className="w-full px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  Manage {roomType.name}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Admissions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Admissions</h3>
            <p className="text-sm text-gray-600">Latest patient check-ins</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { room: 'E102', patient: 'Jane Smith', time: '2 hours ago', type: 'Executive' },
                { room: 'P204', patient: 'Emily Davis', time: '3 hours ago', type: 'Premium' },
                { room: 'B305', patient: 'Neha Singh', time: '5 hours ago', type: 'Basic' },
                { room: 'B307', patient: 'Raj Verma', time: '6 hours ago', type: 'Basic' },
              ].map((admission, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gradient-to-br from-soft-blue-50 to-soft-green-50 rounded-lg border border-gray-200"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-700 font-semibold border border-gray-200 flex-shrink-0">
                    {admission.room}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{admission.patient}</div>
                    <div className="text-xs text-gray-600">{admission.type} Room</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">{admission.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BedsPage;
