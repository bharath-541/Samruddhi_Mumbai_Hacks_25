import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/hospital_model.dart';
import '../services/hospital_service.dart';

final hospitalProvider = StateNotifierProvider<HospitalNotifier, HospitalState>((ref) {
  return HospitalNotifier();
});

class HospitalState {
  final List<HospitalModel> hospitals;
  final bool isLoading;
  final String? error;

  HospitalState({
    this.hospitals = const [],
    this.isLoading = false,
    this.error,
  });

  HospitalState copyWith({
    List<HospitalModel>? hospitals,
    bool? isLoading,
    String? error,
  }) {
    return HospitalState(
      hospitals: hospitals ?? this.hospitals,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class HospitalNotifier extends StateNotifier<HospitalState> {
  HospitalNotifier() : super(HospitalState());
  final HospitalService _hospitalService = HospitalService();

  /// Fetch hospitals from backend
  Future<void> fetchHospitals({
    int limit = 50,
    int offset = 0,
    String? type,
    String? tier,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _hospitalService.getHospitals(
      limit: limit,
      offset: offset,
      type: type,
      tier: tier,
    );
    
    if (response.success && response.data != null) {
      final hospitals = _hospitalService.parseHospitals(response.data);
      state = state.copyWith(hospitals: hospitals, isLoading: false);
    } else {
      state = state.copyWith(
        isLoading: false,
        error: response.error,
      );
    }
  }

  /// Get hospital by ID
  HospitalModel? getHospitalById(String id) {
    try {
      return state.hospitals.firstWhere((h) => h.id == id);
    } catch (e) {
      return null;
    }
  }
}
