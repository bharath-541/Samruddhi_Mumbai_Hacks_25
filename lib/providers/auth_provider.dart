import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/patient_model.dart';
import '../services/auth_service.dart';
import '../services/api_client.dart';

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

class AuthState {
  final bool isAuthenticated;
  final String? email;
  final PatientModel? profile;
  final bool isLoading;
  final String? error;

  AuthState({
    this.isAuthenticated = false,
    this.email,
    this.profile,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    String? email,
    PatientModel? profile,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      email: email ?? this.email,
      profile: profile ?? this.profile,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(AuthState());
  final AuthService _authService = AuthService();

  /// Initialize auth state from saved session
  Future<void> initAuth() async {
    final apiClient = ApiClient();
    if (apiClient.isLoggedIn) {
      // User has saved token, mark as authenticated
      state = state.copyWith(isAuthenticated: true);
      // Optionally: fetch user profile from backend
    }
  }

  /// Register patient - Sign up with email and password
  Future<bool> registerPatient({
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
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _authService.registerPatient(
      email: email,
      password: password,
      name: name,
      dob: dob,
      gender: gender,
      phone: phone,
      bloodGroup: bloodGroup,
      emergencyContact: emergencyContact,
      address: address,
    );
    
    if (response.success && response.data != null) {
      final profile = _authService.parsePatient(response.data);
      state = state.copyWith(
        isAuthenticated: true,
        email: email,
        profile: profile,
        isLoading: false,
      );
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
      return false;
    }
  }

  /// Login with email and password
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    // Development mode: accept any credentials and create a local session.
    // This bypasses backend login so you can test on-device without API.
    state = state.copyWith(isLoading: true, error: null);

    await Future.delayed(const Duration(milliseconds: 300));

    // Create a mock profile using the provided email
    final displayName = email.contains('@') ? email.split('@').first : 'User';
    final mockProfile = PatientModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: displayName[0].toUpperCase() + displayName.substring(1),
      email: email,
      phone: '',
      bloodGroup: '',
      emergencyContact: '',
    );

    // Mark authenticated locally
    state = state.copyWith(
      isAuthenticated: true,
      email: email,
      profile: mockProfile,
      isLoading: false,
      error: null,
    );

    return true;
  }

  /// Logout
  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }
}
