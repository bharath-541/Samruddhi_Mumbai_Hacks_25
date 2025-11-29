import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctorName = location.state?.doctorName || 'Doctor';
  const doctorId = location.state?.doctorId || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo, accept any 6-digit OTP
    if (otpValue.length === 6) {
      navigate('/doctor-dashboard', { 
        state: { 
          doctorName,
          doctorId,
          isAuthenticated: true 
        } 
      });
    } else {
      setError('Invalid OTP. Please try again.');
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue-100 to-soft-green-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate('/doctors')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Doctors</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center mx-auto mb-6 border border-gray-200">
            <Shield className="w-8 h-8 text-gray-700" />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome, Dr. {doctorName}
            </h1>
            <p className="text-sm text-gray-600">
              Please enter your OTP to access your dashboard
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter 6-Digit OTP
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.some(d => !d)}
            className="w-full py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Verify & Continue
              </>
            )}
          </button>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Didn't receive OTP? <span className="font-medium text-blue-600">Resend</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This OTP was sent to your registered mobile number and email
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
