import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'api_config.dart';

/// API Client
/// Handles all HTTP requests with authentication, error handling, and token management
class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  // Token storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  String? _accessToken;
  // ignore: unused_field
  String? _refreshToken; // Stored for future token refresh implementation

  /// Initialize tokens from storage
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString(_accessTokenKey);
    _refreshToken = prefs.getString(_refreshTokenKey);
  }

  /// Check if user has valid token (is logged in)
  bool get isLoggedIn => _accessToken != null && _accessToken!.isNotEmpty;

  /// Save tokens to storage
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    _accessToken = accessToken;
    _refreshToken = refreshToken;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_accessTokenKey, accessToken);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }

  /// Clear tokens on logout
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_accessTokenKey);
    await prefs.remove(_refreshTokenKey);
  }

  /// Get common headers
  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (includeAuth && _accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
      print('🔑 Auth header added: Bearer ${_accessToken!.substring(0, 50)}...');
      print('📧 Full token: $_accessToken');
    } else {
      print('⚠️ No auth token available! isLoggedIn: $isLoggedIn, token: ${_accessToken?.substring(0, 10)}');
    }
    return headers;
  }

  /// Generic GET request
  Future<ApiResponse> get(String endpoint, {Map<String, String>? queryParams}) async {
    try {
      final uri = Uri.parse(ApiConfig.fullUrl(endpoint))
          .replace(queryParameters: queryParams);
      
      final response = await http
          .get(uri, headers: _getHeaders())
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  /// Generic POST request
  Future<ApiResponse> post(String endpoint, {Map<String, dynamic>? body, bool includeAuth = true}) async {
    try {
      final uri = Uri.parse(ApiConfig.fullUrl(endpoint));
      
      final response = await http
          .post(
            uri,
            headers: _getHeaders(includeAuth: includeAuth),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  /// Generic PUT request
  Future<ApiResponse> put(String endpoint, {Map<String, dynamic>? body}) async {
    try {
      final uri = Uri.parse(ApiConfig.fullUrl(endpoint));
      
      final response = await http
          .put(
            uri,
            headers: _getHeaders(),
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  /// Generic DELETE request
  Future<ApiResponse> delete(String endpoint) async {
    try {
      final uri = Uri.parse(ApiConfig.fullUrl(endpoint));
      
      final response = await http
          .delete(uri, headers: _getHeaders())
          .timeout(ApiConfig.connectionTimeout);

      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  /// Multipart file upload (for medical records)
  Future<ApiResponse> uploadFile(
    String endpoint,
    File file, {
    Map<String, String>? fields,
    String fileFieldName = 'file',
  }) async {
    try {
      final uri = Uri.parse(ApiConfig.fullUrl(endpoint));
      final request = http.MultipartRequest('POST', uri);

      // Add headers
      request.headers.addAll(_getHeaders());

      // Add file
      request.files.add(await http.MultipartFile.fromPath(fileFieldName, file.path));

      // Add additional fields
      if (fields != null) {
        request.fields.addAll(fields);
      }

      final streamedResponse = await request.send().timeout(ApiConfig.connectionTimeout);
      final response = await http.Response.fromStream(streamedResponse);

      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  /// Handle HTTP response
  ApiResponse _handleResponse(http.Response response) {
    final statusCode = response.statusCode;
    
    // Parse response body
    dynamic data;
    try {
      data = response.body.isNotEmpty ? jsonDecode(response.body) : null;
    } catch (e) {
      data = response.body;
    }

    if (statusCode >= 200 && statusCode < 300) {
      // Success
      return ApiResponse(
        success: true,
        statusCode: statusCode,
        data: data,
      );
    } else if (statusCode == 401) {
      // Unauthorized - token expired
      return ApiResponse(
        success: false,
        statusCode: statusCode,
        error: 'Unauthorized. Please login again.',
        data: data,
      );
    } else if (statusCode == 404) {
      // Not found
      return ApiResponse(
        success: false,
        statusCode: statusCode,
        error: 'Resource not found',
        data: data,
      );
    } else if (statusCode >= 500) {
      // Server error
      return ApiResponse(
        success: false,
        statusCode: statusCode,
        error: 'Server error. Please try again later.',
        data: data,
      );
    } else {
      // Other client errors
      final errorMsg = data is Map ? (data['message'] ?? data['error'] ?? 'Request failed') : 'Request failed';
      return ApiResponse(
        success: false,
        statusCode: statusCode,
        error: errorMsg,
        data: data,
      );
    }
  }

  /// Handle errors (network, timeout, etc.)
  ApiResponse _handleError(dynamic error) {
    String errorMessage;
    
    if (error is SocketException) {
      errorMessage = 'No internet connection';
    } else if (error is http.ClientException) {
      errorMessage = 'Network error. Please try again.';
    } else if (error.toString().contains('TimeoutException')) {
      errorMessage = 'Request timeout. Please try again.';
    } else {
      errorMessage = 'An unexpected error occurred';
    }

    return ApiResponse(
      success: false,
      statusCode: 0,
      error: errorMessage,
    );
  }
}

/// API Response wrapper
class ApiResponse {
  final bool success;
  final int statusCode;
  final dynamic data;
  final String? error;

  ApiResponse({
    required this.success,
    required this.statusCode,
    this.data,
    this.error,
  });

  @override
  String toString() {
    return 'ApiResponse(success: $success, statusCode: $statusCode, error: $error)';
  }
}
