import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/consent_model.dart';
import '../mock/mock_consents.dart';
import '../services/consent_service.dart';

final consentProvider = StateNotifierProvider<ConsentNotifier, ConsentState>((ref) {
  return ConsentNotifier();
});

class ConsentState {
  final List<ConsentModel> consents;
  final bool isLoading;
  final String? error;

  ConsentState({
    this.consents = const [],
    this.isLoading = false,
    this.error,
  });

  ConsentState copyWith({
    List<ConsentModel>? consents,
    bool? isLoading,
    String? error,
  }) {
    return ConsentState(
      consents: consents ?? this.consents,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ConsentNotifier extends StateNotifier<ConsentState> {
  ConsentNotifier() : super(ConsentState(consents: mockConsents));
  final ConsentService _consentService = ConsentService();

  /// Fetch consents from backend
  Future<void> fetchConsents() async {
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _consentService.getMyConsents();
    
    if (response.success && response.data != null) {
      final consents = _consentService.parseConsents(response.data);
      state = state.copyWith(consents: consents, isLoading: false);
    } else {
      // Fallback to mock data on error
      state = state.copyWith(
        consents: mockConsents,
        isLoading: false,
        error: response.error,
      );
    }
  }

  /// Grant consent to hospital
  Future<ConsentModel?> grantConsent({
    required String hospitalId,
    required String consentType,
    required String purpose,
    required String expiry,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _consentService.grantConsent(
      hospitalId: hospitalId,
      consentType: consentType,
      purpose: purpose,
      expiry: expiry,
    );
    
    if (response.success && response.data != null) {
      final consent = _consentService.parseConsent(response.data);
      if (consent != null) {
        state = state.copyWith(
          consents: [...state.consents, consent],
          isLoading: false,
        );
      }
      return consent;
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
      return null;
    }
  }

  /// Add consent locally (optimistic update)
  void addConsent(ConsentModel consent) {
    state = state.copyWith(consents: [...state.consents, consent]);
  }

  /// Revoke consent by ID
  Future<bool> revokeConsent(String consentId, String reason) async {
    state = state.copyWith(isLoading: true, error: null);
    
    final response = await _consentService.revokeConsent(
      consentId: consentId,
      reason: reason,
    );
    
    if (response.success) {
      final updatedConsents = state.consents.map((c) {
        if (c.id == consentId) {
          return c.copyWith(status: 'revoked');
        }
        return c;
      }).toList();
      state = state.copyWith(consents: updatedConsents, isLoading: false);
      return true;
    } else {
      state = state.copyWith(isLoading: false, error: response.error);
      return false;
    }
  }

  /// Get consent QR code
  Future<String?> getConsentQR(String consentId) async {
    final response = await _consentService.getConsentQR(consentId);
    
    if (response.success && response.data != null) {
      return response.data['qr_code_url'];
    }
    return null;
  }
}
