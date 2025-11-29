import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import Registration from './pages/Registration';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Overview from './pages/Overview';
import Predictions from './pages/Predictions';
import Recommendations from './pages/Recommendations';
import Explainability from './pages/Explainability';
import NotFound from './pages/NotFound';
import AppointmentsPage from './pages/appointmentpage';
import DoctorsPage from './pages/DoctorsPage';
import BedsPage from './pages/BedsPage';
import PatientsPage from './pages/PatientsPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientOtpVerify from './pages/PatientOtpVerify';
import PatientEHR from './pages/PatientEHR';
import ErrorBoundary from './components/error/ErrorBoundary';
import { HospitalProvider } from './contexts/HospitalContext';
import { useNavigation } from './hooks/useNavigation';

// Dashboard content with Layout
const DashboardContent: React.FC = () => {
  const { activeTab, handleTabChange } = useNavigation();
  const location = useLocation();

  // Determine which component to render based on current path
  const getCurrentComponent = () => {
    const path = location.pathname;
    if (path === '/predictions') return <Predictions />;
    if (path === '/recommendations') return <Recommendations />;
    if (path === '/explainability') return <Explainability />;
    return <Dashboard />; // Default for /dashboard/* routes - now includes overview functionality
  };

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      <ErrorBoundary>
        {getCurrentComponent()}
      </ErrorBoundary>
    </Layout>
  );
};

// Main app routes
const AppContent: React.FC = () => {
  return (
    <Routes>
      {/* Landing page as root */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Registration flow */}
      <Route path="/register" element={<Registration />} />
      
      {/* Original Home page with NavigationChips - entry point after Try Demo */}
      <Route path="/home" element={<Home />} />
      
      {/* Dashboard routes with Layout */}
      <Route path="/dashboard/*" element={<DashboardContent />} />
      <Route path="/predictions" element={<DashboardContent />} />
      <Route path="/recommendations" element={<DashboardContent />} />
      <Route path="/explainability" element={<DashboardContent />} />
      
      {/* New Management Pages - No Layout */}
      <Route path="/appointments" element={<AppointmentsPage />} />
      <Route path="/doctors" element={<DoctorsPage />} />
      <Route path="/beds" element={<BedsPage />} />
      <Route path="/patients" element={<PatientsPage />} />
      
      {/* Doctor Authentication & Patient EHR Flow */}
      <Route path="/doctor-login" element={<DoctorLoginPage />} />
      <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
      <Route path="/patient-otp-verify" element={<PatientOtpVerify />} />
      <Route path="/patient-ehr" element={<PatientEHR />} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HospitalProvider>
        <Router>
          <AppContent />
        </Router>
      </HospitalProvider>
    </ErrorBoundary>
  );
};

export default App;