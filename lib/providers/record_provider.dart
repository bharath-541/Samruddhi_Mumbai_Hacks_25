import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/record_model.dart';
import '../mock/mock_records.dart';
import '../services/record_service.dart';

final recordProvider = StateNotifierProvider<RecordNotifier, RecordState>((ref) {
  return RecordNotifier();
});

class RecordState {
  final List<RecordModel> records;
  final bool isLoading;
  final String? error;

  RecordState({
    this.records = const [],
    this.isLoading = false,
    this.error,
  });

  RecordState copyWith({
    List<RecordModel>? records,
    bool? isLoading,
    String? error,
  }) {
    return RecordState(
      records: records ?? this.records,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class RecordNotifier extends StateNotifier<RecordState> {
  RecordNotifier() : super(RecordState(records: mockRecords));
  final RecordService _recordService = RecordService();

  /// Fetch medical history from backend
  /// Note: Requires patient ID - use mock data for now
  Future<void> fetchRecords({String? patientId}) async {
    state = state.copyWith(isLoading: true, error: null);
    
    // If no patient ID provided, use mock data
    if (patientId == null) {
      state = state.copyWith(records: mockRecords, isLoading: false);
      return;
    }
    
    // Fetch from backend using EHR endpoints
    final response = await _recordService.getMedicalHistory(patientId);
    
    if (response.success && response.data != null) {
      final records = _recordService.parseRecords(response.data);
      state = state.copyWith(records: records, isLoading: false);
    } else {
      // Fallback to mock data on error
      state = state.copyWith(
        records: mockRecords,
        isLoading: false,
        error: response.error,
      );
    }
  }

  /// Add record locally (optimistic update)
  void addRecord(RecordModel record) {
    state = state.copyWith(records: [...state.records, record]);
  }

  /// Fetch prescriptions for patient
  Future<List<Map<String, dynamic>>> fetchPrescriptions(String patientId, {int limit = 10}) async {
    final response = await _recordService.getPrescriptions(patientId, limit: limit);
    
    if (response.success && response.data != null) {
      return _recordService.parsePrescriptions(response.data);
    }
    return [];
  }

  /// Fetch test reports for patient
  Future<List<Map<String, dynamic>>> fetchTestReports(String patientId, {int limit = 10}) async {
    final response = await _recordService.getTestReports(patientId, limit: limit);
    
    if (response.success && response.data != null) {
      return _recordService.parseTestReports(response.data);
    }
    return [];
  }

  /// Fetch IoT device data
  Future<List<Map<String, dynamic>>> fetchIoTData(
    String patientId,
    String deviceType, {
    String? from,
    String? to,
    int limit = 100,
  }) async {
    final response = await _recordService.getIoTData(
      patientId,
      deviceType,
      from: from,
      to: to,
      limit: limit,
    );
    
    if (response.success && response.data != null) {
      return _recordService.parseIoTReadings(response.data);
    }
    return [];
  }
}
