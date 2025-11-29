/// API Configuration
/// Centralized configuration for API endpoints and environment settings
class ApiConfig {
  // Environment mode - switch this when deploying to production
  static const bool isDevelopment = false; // Using production backend
  
  // Base URLs
  static const String devBaseUrl = 'http://localhost:8000'; // Local development
  static const String prodBaseUrl = 'https://samruddhi-backend.onrender.com'; // Production
  
  // Current base URL based on environment
  static String get baseUrl => isDevelopment ? devBaseUrl : prodBaseUrl;
  
  // API Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  
  // Health Check endpoints
  static const String healthLive = '/health/live';
  static const String healthReady = '/health/ready';
  
  // Hospital endpoints (Public - No Auth)
  static const String getHospitals = '/hospitals';
  static const String getHospitalCapacity = '/hospitals/{id}/capacity';
  static const String getHospitalDashboard = '/hospitals/{id}/dashboard';
  
  // Auth endpoints (No JWT required)
  static const String patientSignup = '/auth/patient/signup';
  static const String patientLogin = '/auth/patient/login';
  
  // Patient endpoints
  static const String registerPatient = '/patients/register';
  static const String searchPatient = '/patients/search';
  
  // Consent Management endpoints
  static const String grantConsent = '/consent/grant';
  static const String revokeConsent = '/consent/revoke';
  static const String getMyConsents = '/consent/my';
  static const String getConsentQR = '/consent/{id}/qr';
  static const String checkConsentStatus = '/consent/status/{id}';
  
  // EHR endpoints (Require Staff JWT + Consent Token)
  static const String getPatientProfile = '/ehr/patient/{id}';
  static const String getPrescriptions = '/ehr/patient/{id}/prescriptions';
  static const String getTestReports = '/ehr/patient/{id}/test-reports';
  static const String getMedicalHistory = '/ehr/patient/{id}/medical-history';
  static const String getIoTData = '/ehr/patient/{id}/iot/{deviceType}';
  
  // Profile endpoints (alias for patient profile)
  static const String getProfile = '/ehr/patient/{id}';
  static const String updateProfile = '/ehr/patient/{id}';
  
  // Upload endpoints
  static const String uploadPresignedUrl = '/upload/presigned-url';
  
  // Helper to construct full URL
  static String fullUrl(String endpoint) => '$baseUrl$endpoint';
  
  // Replace path parameters (e.g., /hospitals/{id} -> /hospitals/123)
  static String replacePath(String endpoint, Map<String, String> params) {
    String result = endpoint;
    params.forEach((key, value) {
      result = result.replaceAll('{$key}', value);
    });
    return result;
  }
}
