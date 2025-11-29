import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hospital,
  TrendingUp,
  Activity,
  Shield,
  MapPin,
  Users,
  Brain,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3,
  Clock,
  FileText,
  Lock as LockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleTryDemo = () => {
    navigate('/home');
  };

  const features = [
    {
      icon: <FileText className="w-5 h-5" />,
      title: "Universal Patient EHR",
      description: "Patients own their medical records with a universal ID. Access health data anywhere, anytime with full privacy control."
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "AI Surge Predictions",
      description: "Predict patient influx based on weather, pollution, festivals, and real-time data. Stay ahead of demand spikes."
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Privacy-First Access",
      description: "Two-factor OTP authentication ensures only authorized doctors access patient records with explicit consent."
    },
    {
      icon: <Hospital className="w-5 h-5" />,
      title: "Complete Hospital Portal",
      description: "Manage operations, track resources, monitor staff, and optimize workflows from one unified dashboard."
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Patient Mobile App",
      description: "Patients view their health records, prescriptions, and medical history on their phones. Data portability redefined."
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      title: "Open Healthcare Platform",
      description: "Centralized health records on one platform. Building an open ecosystem to revolutionize hospital management globally."
    }
  ];

  const stats = [
    { value: "Universal", label: "Patient EHR" },
    { value: "AI", label: "Surge Predictions" },
    { value: "Mobile", label: "Patient App" },
    { value: "Open", label: "Ecosystem" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="relative">
        {/* Navigation Bar */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                  <img
                    src="/logo.webp"
                    alt="Samruddhi Logo"
                    className="w-full h-full object-cover scale-150"
                  />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Samruddhi</h1>
              </div>
              <div className="hidden md:flex items-center gap-6">
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Home
                </a>
                <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Features
                </a>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  About
                </a>
                <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Revolutionary Healthcare Ecosystem
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Healthcare, Reimagined
                <span className="text-gray-600"> for Everyone</span>
              </h1>

              <p className="text-base text-gray-600 leading-relaxed">
                A complete healthcare ecosystem where patients own their medical data, hospitals predict surge events with AI, and everyone accesses health records anywhere, anytime.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleTryDemo}
                  className="bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-all duration-200 flex items-center justify-center gap-2 text-base font-medium shadow-lg hover:shadow-xl"
                >
                  <Activity className="w-5 h-5" />
                  View Live Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 pt-4">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div className="text-sm font-bold text-gray-900 mb-0.5">
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Cyclic Flow Diagram */}
            <div className="relative">
              <div className="relative w-full h-[500px] flex items-center justify-center">
                {/* Circular background */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 rounded-full border-2 border-dashed border-gray-200"></div>
                </div>

                {/* Patient - Top */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-2 border-blue-200 shadow-sm">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Patient</p>
                    <p className="text-[10px] text-gray-500">Owns Data</p>
                  </div>
                </div>

                {/* Arrow: Patient -> Doctor */}
                <div className="absolute top-[80px] right-[100px] flex items-center gap-1">
                  <div className="text-[10px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    OTP →
                  </div>
                </div>

                {/* Doctor - Right */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center border-2 border-green-200 shadow-sm">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Doctor</p>
                    <p className="text-[10px] text-gray-500">Consent Access</p>
                  </div>
                </div>

                {/* Hospital - Bottom */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center border-2 border-purple-200 shadow-sm">
                    <Hospital className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Hospital</p>
                    <p className="text-[10px] text-gray-500">AI Insights</p>
                  </div>
                </div>

                {/* Arrow: Hospital -> Patient */}
                <div className="absolute bottom-[80px] left-[100px] flex items-center gap-1">
                  <div className="text-[10px] font-medium text-gray-600 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    ← Update
                  </div>
                </div>

                {/* Mobile App - Left */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center border-2 border-orange-200 shadow-sm">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-900">Mobile</p>
                    <p className="text-[10px] text-gray-500">Anytime Access</p>
                  </div>
                </div>

                {/* Center - AI Surge Prediction */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-50 to-purple-50 flex items-center justify-center border-2 border-teal-200 shadow-lg">
                    <TrendingUp className="w-10 h-10 text-teal-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-900">AI Surge</p>
                    <p className="text-[10px] text-gray-500">Predictions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="max-w-7xl mx-auto px-6 py-16 bg-gray-50">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Complete Healthcare Ecosystem
            </h2>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">
              From portable EHR to AI predictions - everything you need to revolutionize healthcare
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group"
              >
                <div className="flex items-start gap-4 p-6 rounded-xl bg-white border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-700">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-gray-900 rounded-lg p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">
              Join the Healthcare Revolution
            </h2>
            <p className="text-sm text-gray-300 mb-6 max-w-xl mx-auto">
              Be part of an open ecosystem where patients own their data and hospitals predict the future
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleGetStarted}
                className="bg-gray-800 text-white border border-gray-700 px-6 py-3 rounded-lg hover:bg-gray-700 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Hospital className="w-4 h-4" />
                Start Registration
              </button>
              <button
                onClick={handleTryDemo}
                className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Activity className="w-4 h-4" />
                View Demo
              </button>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div id="contact" className="max-w-7xl mx-auto px-6 py-16 border-t border-gray-200">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
              <p className="text-sm text-gray-600">Have questions? Want to collaborate? Reach out!</p>
            </div>

            <div className="flex justify-center">
              <a href="mailto:nullcrew520@gmail.com" className="group max-w-md w-full">
                <div className="bg-white rounded-lg p-8 border border-gray-200 hover:border-gray-300 transition-all text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gray-100 transition-colors">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-gray-900 mb-2">Get in Touch</p>
                  <p className="text-sm text-gray-600 mb-1">nullcrew520@gmail.com</p>
                  <p className="text-xs text-gray-500">We'd love to hear from you!</p>
                </div>
              </a>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600 mb-2">Built by <span className="font-semibold text-gray-900">NULCREW</span></p>
              <p className="text-xs text-gray-500">Revolutionizing Healthcare with Technology</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto px-6 py-8 border-t border-gray-100">
          <div className="text-center text-gray-500 text-xs">
            <p>© 2025 Samruddhi. Revolutionizing Healthcare, One Record at a Time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
