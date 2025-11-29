import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/patient_model.dart';
import '../mock/mock_profile.dart';
import '../services/profile_service.dart';

final profileProvider = StateNotifierProvider<ProfileNotifier, ProfileState>((ref) {
  return ProfileNotifier();
});

class ProfileState {
  final PatientModel? profile;
  final bool isLoading;
  final String? error;

  ProfileState({
    this.profile,
    this.isLoading = false,
    this.error,
  });

  ProfileState copyWith({
    PatientModel? profile,
    bool? isLoading,
    String? error,
  }) {
    return ProfileState(
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ProfileNotifier extends StateNotifier<ProfileState> {
  ProfileNotifier() : super(ProfileState(profile: mockProfile));
  final ProfileService _profileService = ProfileService();

  /// Fetch profile from backend
  /// Note: Requires patient ID - use mock data if not available
  Future<void> fetchProfile({String? patientId}) async {
    state = state.copyWith(isLoading: true, error: null);
    
    // If no patient ID, use mock data
    if (patientId == null) {
      state = state.copyWith(profile: mockProfile, isLoading: false);
      return;
    }
    
    final response = await _profileService.getProfile(patientId);
    
    if (response.success && response.data != null) {
      final profile = _profileService.parseProfile(response.data);
      state = state.copyWith(profile: profile, isLoading: false);
    } else {
      // Fallback to mock data on error
      state = state.copyWith(
        profile: mockProfile,
        isLoading: false,
        error: response.error,
      );
    }
  }

  /// Update profile
  Future<bool> updateProfile(String patientId, PatientModel profile) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _profileService.updateProfile(patientId, profile);
    
    if (response.success) {
      state = state.copyWith(profile: profile, isLoading: false);
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
      return false;
    }
  }

  /// Set profile locally (for mock/testing)
  void setProfile(PatientModel profile) {
    state = state.copyWith(profile: profile);
  }
}
