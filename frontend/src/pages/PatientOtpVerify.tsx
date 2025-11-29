import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, ArrowLeft, User } from 'lucide-react';

const PatientOtpVerify: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patientName = location.state?.patientName || 'Patient';
  const patientId = location.state?.patientId || '';
  const doctorName = location.state?.doctorName || 'Doctor';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`patient-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`patient-otp-${index - 1}`);
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

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (otpValue.length === 6) {
      navigate('/patient-ehr', { 
        state: { 
          patientName,
          patientId,
          doctorName,
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
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Patients</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg flex items-center justify-center mx-auto mb-6 border border-gray-200">
            <User className="w-8 h-8 text-gray-700" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Patient Verification Required
            </h1>
            <p className="text-sm text-gray-600 mb-1">
              Requesting access to <span className="font-semibold">{patientName}'s</span> EHR
            </p>
            <p className="text-xs text-gray-500">
              Patient ID: {patientId}
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-gray-700 text-center">
              Patient will receive OTP on their registered mobile to authorize access
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Patient's 6-Digit OTP
            </label>
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`patient-otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

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
                Verify & Access EHR
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Patient didn't receive OTP? <span className="font-medium text-purple-600">Resend</span>
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Secure Access Protocol</p>
              <p className="text-xs text-gray-600 mt-1">
                This OTP ensures patient consent before accessing their medical records
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientOtpVerify;
