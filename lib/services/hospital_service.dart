import '../models/hospital_model.dart';
import 'api_client.dart';
import 'api_config.dart';

/// Hospital Service
/// Handles hospital listing and details (Public endpoints - No auth required)
class HospitalService {
  final ApiClient _apiClient = ApiClient();

  /// Get list of hospitals with optional filters
  Future<ApiResponse> getHospitals({
    int limit = 10,
    int offset = 0,
    String? type,
    String? tier,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
      'offset': offset.toString(),
    };
    
    if (type != null) queryParams['type'] = type;
    if (tier != null) queryParams['tier'] = tier;

    return await _apiClient.get(
      ApiConfig.getHospitals,
      queryParams: queryParams,
    );
  }

  /// Get hospital capacity information
  Future<ApiResponse> getHospitalCapacity(String hospitalId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getHospitalCapacity,
      {'id': hospitalId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Get hospital dashboard (complete stats)
  Future<ApiResponse> getHospitalDashboard(String hospitalId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getHospitalDashboard,
      {'id': hospitalId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Parse hospitals list from API response
  List<HospitalModel> parseHospitals(dynamic data) {
    try {
      if (data is List) {
        return data.map((h) => HospitalModel.fromJson(h)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse single hospital from API response
  HospitalModel? parseHospital(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        return HospitalModel.fromJson(data['hospital'] ?? data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
