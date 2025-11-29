import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'api_client.dart';
import 'api_config.dart';

/// Upload Service using Backend Supabase Storage
/// 
/// 3-Step Upload Process:
/// 1. Get presigned URL from backend
/// 2. Upload file to Supabase storage using presigned URL
/// 3. Return path to save in EHR
/// 
/// Works on both mobile and web!
class UploadService {
  final ApiClient _apiClient = ApiClient();

  /// Pick PDF file from device (works on mobile and web)
  Future<PlatformFile?> pickPdfFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        allowMultiple: false,
        withData: kIsWeb, // On web, we need bytes
      );

      if (result != null && result.files.isNotEmpty) {
        return result.files.single;
      }
      return null;
    } catch (e) {
      throw Exception('Failed to pick file: $e');
    }
  }

  /// Step 1: Get presigned upload URL from backend
  Future<PresignedUrlResponse?> getPresignedUrl({
    required String fileName,
    required String fileType,
  }) async {
    try {
      final response = await _apiClient.post(
        ApiConfig.uploadPresignedUrl,
        body: {
          'fileName': fileName,
          'fileType': fileType,
        },
      );

      if (response.success && response.data != null) {
        return PresignedUrlResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      throw Exception('Failed to get upload URL: $e');
    }
  }

  /// Step 2: Upload file to Supabase storage using presigned URL
  Future<bool> uploadToSupabase({
    required String uploadUrl,
    required PlatformFile file,
  }) async {
    try {
      List<int> bytes;
      
      if (kIsWeb) {
        // Web: Use bytes from memory
        if (file.bytes == null) {
          throw Exception('File bytes are null on web');
        }
        bytes = file.bytes!;
      } else {
        // Mobile: Read from file path
        if (file.path == null) {
          throw Exception('File path is null on mobile');
        }
        // For mobile, we need to read bytes from the file
        final fileBytes = await http.readBytes(Uri.file(file.path!));
        bytes = fileBytes;
      }
      
      final response = await http.put(
        Uri.parse(uploadUrl),
        headers: {
          'Content-Type': 'application/pdf',
          'x-upsert': 'true',
        },
        body: bytes,
      );

      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      throw Exception('Failed to upload file to Supabase: $e');
    }
  }

  /// Complete upload flow: pick, get URL, upload
  /// Returns the storage path to save in EHR
  Future<String?> uploadPdf() async {
    try {
      // Step 1: Pick PDF file
      final file = await pickPdfFile();
      if (file == null) return null;

      print('📄 File picked: ${file.name}');

      // Step 2: Get presigned URL from backend
      final presignedUrl = await getPresignedUrl(
        fileName: file.name,
        fileType: 'application/pdf',
      );

      if (presignedUrl == null) {
        throw Exception('Failed to get upload URL from backend');
      }

      print('🔗 Got presigned URL');

      // Step 3: Upload file to Supabase
      final uploaded = await uploadToSupabase(
        uploadUrl: presignedUrl.uploadUrl,
        file: file,
      );

      if (uploaded) {
        print('✅ Upload successful!');
        print('📁 Storage path: ${presignedUrl.path}');
        
        // Return the path to store in database
        return presignedUrl.path;
      }
      return null;
    } catch (e) {
      print('❌ Upload failed: $e');
      throw Exception('Upload failed: $e');
    }
  }

  /// Upload image (for test reports, prescriptions with images)
  Future<String?> uploadImage() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: kIsWeb,
      );

      if (result != null && result.files.isNotEmpty) {
        final file = result.files.single;
        
        // Determine file type
        String fileType = 'image/jpeg';
        if (file.extension == 'png') {
          fileType = 'image/png';
        } else if (file.extension == 'jpg' || file.extension == 'jpeg') {
          fileType = 'image/jpeg';
        }

        // Get presigned URL
        final presignedUrl = await getPresignedUrl(
          fileName: file.name,
          fileType: fileType,
        );

        if (presignedUrl == null) return null;

        // Upload to Supabase
        final uploaded = await uploadToSupabase(
          uploadUrl: presignedUrl.uploadUrl,
          file: file,
        );

        if (uploaded) {
          return presignedUrl.path;
        }
      }
      return null;
    } catch (e) {
      throw Exception('Image upload failed: $e');
    }
  }
}

/// Presigned URL Response model
class PresignedUrlResponse {
  final String uploadUrl;
  final String path;
  final String? token;

  PresignedUrlResponse({
    required this.uploadUrl,
    required this.path,
    this.token,
  });

  factory PresignedUrlResponse.fromJson(Map<String, dynamic> json) {
    return PresignedUrlResponse(
      uploadUrl: json['uploadUrl'] as String,
      path: json['path'] as String,
      token: json['token'] as String?,
    );
  }
}
