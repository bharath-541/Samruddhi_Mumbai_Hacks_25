import '../models/patient_model.dart';
import 'api_client.dart';
import 'api_config.dart';

/// Authentication Service
/// Handles patient registration with backend (after Supabase auth)
/// Note: Actual auth (OTP) is handled by Supabase, this registers patient profile
class AuthService {
  final ApiClient _apiClient = ApiClient();

  /// Register patient with backend - No JWT required
  Future<ApiResponse> registerPatient({
    required String email,
    required String password,
    required String name,
    required String dob,
    required String gender,
    required String phone,
    String? bloodGroup,
    String? emergencyContact,
    Map<String, String>? address,
  }) async {
    return await _apiClient.post(
      ApiConfig.patientSignup,
      body: {
        'email': email,
        'password': password,
        'name': name,
        'dob': dob,
        'gender': gender.toLowerCase(),
        'phone': phone,
        if (bloodGroup != null) 'bloodGroup': bloodGroup,
        if (emergencyContact != null) 'emergencyContact': emergencyContact,
        if (address != null) 'address': address,
      },
    );
  }

  /// Login with email and password
  Future<ApiResponse> login({
    required String email,
    required String password,
  }) async {
    return await _apiClient.post(
      ApiConfig.patientLogin,
      body: {
        'email': email,
        'password': password,
      },
    );
  }

  /// Save session tokens from login response
  Future<void> saveSession(Map<String, dynamic> data) async {
    try {
      final session = data['session'];
      if (session != null) {
        final accessToken = session['access_token'];
        final refreshToken = session['refresh_token'];
        if (accessToken != null && refreshToken != null) {
          await _apiClient.saveTokens(accessToken, refreshToken);
        }
      }
    } catch (e) {
      // Token save failed, but don't block login
    }
  }

  /// Logout user and clear tokens
  Future<void> logout() async {
    await _apiClient.clearTokens();
  }

  /// Parse patient profile from API response
  PatientModel? parsePatient(Map<String, dynamic> data) {
    try {
      final patientData = data['patient'] ?? data;
      return PatientModel.fromJson(patientData);
    } catch (e) {
      return null;
    }
  }
}

