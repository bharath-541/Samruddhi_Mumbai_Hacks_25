import '../models/consent_model.dart';
import 'api_client.dart';
import 'api_config.dart';

/// Consent Service
/// Manages consent requests and permissions with hospitals
class ConsentService {
  final ApiClient _apiClient = ApiClient();

  /// Grant consent to hospital for accessing medical records
  /// Requires: Patient JWT (Authorization header)
  Future<ApiResponse> grantConsent({
    required String hospitalId,
    required String consentType, // 'full_access', etc.
    required String purpose, // 'treatment', etc.
    required String expiry, // ISO 8601 format: '2025-12-31T23:59:59Z'
  }) async {
    return await _apiClient.post(
      ApiConfig.grantConsent,
      body: {
        'hospital_id': hospitalId,
        'consent_type': consentType,
        'purpose': purpose,
        'expiry': expiry,
      },
    );
  }

  /// Get all consents granted by the patient
  /// Requires: Patient JWT
  Future<ApiResponse> getMyConsents() async {
    return await _apiClient.get(ApiConfig.getMyConsents);
  }

  /// Revoke a consent
  /// Requires: Patient JWT
  Future<ApiResponse> revokeConsent({
    required String consentId,
    String? reason,
  }) async {
    return await _apiClient.post(
      ApiConfig.revokeConsent,
      body: {
        'consent_id': consentId,
        if (reason != null) 'reason': reason,
      },
    );
  }

  /// Get QR code image for a consent
  /// Requires: Patient JWT (must own the consent)
  /// Returns: Image data (PNG)
  Future<ApiResponse> getConsentQR(String consentId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.getConsentQR,
      {'id': consentId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Check consent status (Public endpoint - no auth required)
  Future<ApiResponse> checkConsentStatus(String consentId) async {
    final endpoint = ApiConfig.replacePath(
      ApiConfig.checkConsentStatus,
      {'id': consentId},
    );
    return await _apiClient.get(endpoint);
  }

  /// Parse consents list from API response
  List<ConsentModel> parseConsents(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final consents = data['consents'] ?? data['data'] ?? [];
        return (consents as List)
            .map((c) => ConsentModel.fromJson(c))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Parse single consent from API response
  ConsentModel? parseConsent(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        return ConsentModel.fromJson(data['consent'] ?? data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Extract consent token from grant response
  String? extractConsentToken(dynamic data) {
    try {
      if (data is Map<String, dynamic>) {
        final consent = data['consent'];
        return consent?['consent_token'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

