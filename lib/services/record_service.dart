import 'dart:io';
import '../models/record_model.dart';
import 'api_client.dart';
import 'api_config.dart';

/// Medical Record Service
/// Handles medical record operations and EHR data
class RecordService {
  final ApiClient _apiClient = ApiClient();

  /// Get all prescriptions for a patient
  /// Requires: Staff JWT + Consent Token OR Patient JWT (for own records)
  Future<ApiResponse> getPrescriptions(String patientId, {int limit = 10}) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getPrescriptions,
      {'id': patientId},
    );
    return await _apiClient.get(
      endpoint,
      queryParams: {'limit': limit.toString()},
    );
  }

  /// Get test reports for a patient
  /// Requires: Staff JWT + Consent Token OR Patient JWT (for own records)
  Future<ApiResponse> getTestReports(String patientId, {int limit = 10}) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getTestReports,
      {'id': patientId},
    );
    return await _apiClient.get(
      endpoint,
      queryParams: {'limit': limit.toString()},
    );
  }

  /// Get complete medical history for a patient
  /// Requires: Staff JWT + Consent Token OR Patient JWT (for own records)
  Future<ApiResponse> getMedicalHistory(String patientId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getMedicalHistory,
      {'id': patientId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Get IoT device data for a patient
  /// Requires: Staff JWT + Consent Token OR Patient JWT (for own records)
  /// deviceType: 'heart_rate', 'blood_pressure', 'oxygen_saturation', 'temperature'
  Future<ApiResponse> getIoTData(
    String patientId,
    String deviceType, {
    String? from,
    String? to,
    int limit = 100,
  }) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getIoTData,
      {'id': patientId, 'deviceType': deviceType},
    );
    
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    if (from != null) queryParams['from'] = from;
    if (to != null) queryParams['to'] = to;

    return await _apiClient.get(endpoint, queryParams: queryParams);
  }

  /// Upload a new medical record (legacy method - may not be used with new backend)
  Future<ApiResponse> uploadRecord({
    required File file,
    required String type,
    required String description,
    String? hospital,
    String? doctor,
  }) async {
    // Note: This endpoint may not exist in the new backend
    // Keeping for backward compatibility
    return await _apiClient.uploadFile(
      '/records/upload',
      file,
      fields: {
        'type': type,
        'description': description,
        if (hospital != null) 'hospital': hospital,
        if (doctor != null) 'doctor': doctor,
      },
      fileFieldName: 'record_file',
    );
  }

  /// Parse records list from API response
  List<RecordModel> parseRecords(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final records = data['records'] ?? data['data'] ?? [];
        return (records as List)
            .map((r) => RecordModel.fromJson(r))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse prescriptions from API response
  List<Map<String, dynamic>> parsePrescriptions(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final prescriptions = data['prescriptions'] ?? [];
        return List<Map<String, dynamic>>.from(prescriptions);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse test reports from API response
  List<Map<String, dynamic>> parseTestReports(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final reports = data['reports'] ?? [];
        return List<Map<String, dynamic>>.from(reports);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse medical history from API response
  Map<String, dynamic>? parseMedicalHistory(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        return data['history'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Parse IoT device readings from API response
  List<Map<String, dynamic>> parseIoTReadings(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final readings = data['readings'] ?? [];
        return List<Map<String, dynamic>>.from(readings);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse single record from API response
  RecordModel? parseRecord(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        return RecordModel.fromJson(data['record'] ?? data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

