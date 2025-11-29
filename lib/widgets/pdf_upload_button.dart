import 'package:flutter/material.dart';
import '../services/upload_service.dart';

/// PDF Upload Button Widget
/// Reusable button for uploading PDF files
class PdfUploadButton extends StatefulWidget {
  final Function(String pdfUrl) onUploadSuccess;
  final String buttonText;
  final IconData icon;
  final Color? backgroundColor;
  final Color? textColor;

  const PdfUploadButton({
    super.key,
    required this.onUploadSuccess,
    this.buttonText = 'Upload PDF',
    this.icon = Icons.upload_file,
    this.backgroundColor,
    this.textColor,
  });

  @override
  State<PdfUploadButton> createState() => _PdfUploadButtonState();
}

class _PdfUploadButtonState extends State<PdfUploadButton> {
  final UploadService _uploadService = UploadService();
  bool _isUploading = false;

  Future<void> _handleUpload() async {
    if (_isUploading) return;

    setState(() => _isUploading = true);

    try {
      final pdfUrl = await _uploadService.uploadPdf();
      
      if (pdfUrl != null) {
        print('📄 PDF uploaded successfully!');
        print('🔗 URL: $pdfUrl');
        print('✅ This URL is publicly accessible');
        
        widget.onUploadSuccess(pdfUrl);
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('PDF uploaded successfully'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Upload cancelled'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: ${e.toString()}'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: _isUploading ? null : _handleUpload,
      icon: _isUploading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Icon(widget.icon),
      label: Text(_isUploading ? 'Uploading...' : widget.buttonText),
      style: ElevatedButton.styleFrom(
        backgroundColor: widget.backgroundColor ?? Theme.of(context).primaryColor,
        foregroundColor: widget.textColor ?? Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
