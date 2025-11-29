import '../models/patient_model.dart';
import 'api_client.dart';
import 'api_config.dart';

/// Profile Service
/// Manages user profile data
class ProfileService {
  final ApiClient _apiClient = ApiClient();

  /// Get user profile by patient ID
  Future<ApiResponse> getProfile(String patientId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getProfile,
      {'id': patientId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Update user profile by patient ID
  Future<ApiResponse> updateProfile(String patientId, PatientModel profile) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.updateProfile,
      {'id': patientId},
    );
    return await _apiClient.put(
      endpoint,
      body: profile.toJson(),
    );
  }

  /// Parse profile from API response
  PatientModel? parseProfile(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        return PatientModel.fromJson(data['profile'] ?? data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
