// Example: How to use Cloudinary upload in your app

import 'package:flutter/material.dart';
import '../services/upload_service.dart';
import '../widgets/pdf_upload_button.dart';

/*

CLOUDINARY SETUP (Do this FIRST!):
================================

1. Go to https://cloudinary.com/users/register_free
2. Create free account
3. Get your credentials:
   - Cloud Name: e.g., "samruddhi-health"
   - Create upload preset: "patient_documents" (unsigned)
   
4. Update lib/services/upload_service.dart:
   static const String cloudName = 'YOUR_CLOUD_NAME';
   static const String uploadPreset = 'YOUR_UPLOAD_PRESET';

5. Run: flutter pub get

DONE! Now you can upload PDFs directly to Cloudinary!

*/

// ============================================
// EXAMPLE 1: Simple Upload Button
// ============================================

class SimpleUploadExample extends StatefulWidget {
  const SimpleUploadExample({super.key});

  @override
  State<SimpleUploadExample> createState() => _SimpleUploadExampleState();
}

class _SimpleUploadExampleState extends State<SimpleUploadExample> {
  String? _uploadedPdfUrl;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload PDF')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // ✅ Simple upload button
            PdfUploadButton(
              onUploadSuccess: (url) {
                setState(() {
                  _uploadedPdfUrl = url;
                });
                print('✅ PDF uploaded to: $url');
                // URL example:
                // https://res.cloudinary.com/samruddhi-health/raw/upload/v1732876543/patient_documents/prescription.pdf
              },
            ),
            
            const SizedBox(height: 20),
            
            // Display uploaded URL
            if (_uploadedPdfUrl != null)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.green, size: 48),
                    const SizedBox(height: 8),
                    const Text('PDF Uploaded!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    SelectableText(
                      _uploadedPdfUrl!,
                      style: const TextStyle(fontSize: 12, color: Colors.blue),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '✅ This URL is ready for:\n'
                      '• Storing in database\n'
                      '• LLM/OCR processing\n'
                      '• RAG embeddings\n'
                      '• Direct download',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}


// ============================================
// EXAMPLE 2: Upload with Form (Prescription)
// ============================================

class UploadPrescriptionExample extends StatefulWidget {
  const UploadPrescriptionExample({super.key});

  @override
  State<UploadPrescriptionExample> createState() => _UploadPrescriptionExampleState();
}

class _UploadPrescriptionExampleState extends State<UploadPrescriptionExample> {
  final _doctorController = TextEditingController();
  String? _pdfUrl;

  Future<void> _submitPrescription() async {
    // Submit to backend with Cloudinary URL
    final data = {
      'doctor_name': _doctorController.text,
      'pdf_url': _pdfUrl, // ✅ Cloudinary URL
      'date': DateTime.now().toIso8601String(),
    };
    
    print('Submitting to backend: $data');
    
    // Your backend stores this URL in database
    // Later, your LLM can access it directly:
    // await openAI.parse(_pdfUrl);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Prescription')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _doctorController,
              decoration: const InputDecoration(labelText: 'Doctor Name'),
            ),
            const SizedBox(height: 20),
            
            // Upload PDF
            PdfUploadButton(
              onUploadSuccess: (url) {
                setState(() => _pdfUrl = url);
              },
            ),
            
            if (_pdfUrl != null) ...[
              const SizedBox(height: 8),
              const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.green, size: 16),
                  SizedBox(width: 4),
                  Text('PDF uploaded', style: TextStyle(color: Colors.green)),
                ],
              ),
            ],
            
            const SizedBox(height: 20),
            
            ElevatedButton(
              onPressed: _pdfUrl != null ? _submitPrescription : null,
              child: const Text('Submit Prescription'),
            ),
          ],
        ),
      ),
    );
  }
}


// ============================================
// EXAMPLE 3: Manual Upload with Progress
// ============================================

class ManualUploadExample extends StatefulWidget {
  const ManualUploadExample({super.key});

  @override
  State<ManualUploadExample> createState() => _ManualUploadExampleState();
}

class _ManualUploadExampleState extends State<ManualUploadExample> {
  final UploadService _uploadService = UploadService();
  bool _isUploading = false;
  String? _uploadedUrl;
  String? _error;

  Future<void> _uploadPdf() async {
    setState(() {
      _isUploading = true;
      _error = null;
    });

    try {
      // Upload to Cloudinary
      final url = await _uploadService.uploadPdf(
        folder: 'prescriptions', // Organize in folders
      );

      if (url != null) {
        setState(() {
          _uploadedUrl = url;
        });
        
        // ✅ Now use this URL for:
        // 1. Save to backend database
        // 2. Send to LLM for OCR:
        //    final text = await llamaOCR.parse(url);
        // 3. Embed in RAG system:
        //    await pinecone.embed(url);
        
        print('✅ Upload successful!');
        print('📄 URL: $url');
        print('🤖 Ready for LLM/OCR processing!');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Manual Upload')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: _isUploading ? null : _uploadPdf,
              child: _isUploading 
                ? const SizedBox(
                    width: 20, 
                    height: 20, 
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Upload PDF'),
            ),
            
            if (_uploadedUrl != null) ...[
              const SizedBox(height: 20),
              const Icon(Icons.check_circle, color: Colors.green, size: 48),
              const Text('Upload Successful!'),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.all(16),
                child: SelectableText(_uploadedUrl!),
              ),
            ],
            
            if (_error != null) ...[
              const SizedBox(height: 20),
              Text(
                'Error: $_error',
                style: const TextStyle(color: Colors.red),
              ),
            ],
          ],
        ),
      ),
    );
  }
}


// ============================================
// EXAMPLE 4: Using URL for LLM/OCR
// ============================================

class LLMIntegrationExample {
  final UploadService _uploadService = UploadService();
  
  Future<void> processDocumentWithAI() async {
    // Step 1: Upload PDF to Cloudinary
    final pdfUrl = await _uploadService.uploadPdf();
    
    if (pdfUrl == null) return;
    
    print('📄 PDF uploaded to: $pdfUrl');
    
    // Step 2: Send URL to your LLM/OCR service
    
    // Example with OpenAI Vision API
    /*
    final openai = OpenAI(apiKey: 'your-key');
    final result = await openai.vision.analyze(pdfUrl);
    print('🤖 AI extracted: ${result.text}');
    */
    
    // Example with LlamaOCR
    /*
    final llamaOCR = LlamaOCR(apiKey: 'your-key');
    final text = await llamaOCR.parse(pdfUrl);
    print('📝 Extracted text: $text');
    */
    
    // Example with RAG (Pinecone/Weaviate)
    /*
    final embeddings = await openai.embeddings.create(input: pdfUrl);
    await pinecone.upsert(embeddings);
    print('🔍 Embedded in vector database');
    */
    
    // Step 3: Store URL in your backend
    /*
    await apiClient.post('/ehr/my/prescription', body: {
      'doctor_name': 'Dr. Smith',
      'pdf_url': pdfUrl, // ✅ Cloudinary URL
    });
    */
  }
}


// ============================================
// EXAMPLE 5: Upload Different File Types
// ============================================

class MultiFileTypeExample extends StatelessWidget {
  final UploadService _uploadService = UploadService();
  
  MultiFileTypeExample({super.key});

  Future<void> uploadPrescription() async {
    // Upload PDF prescription
    final url = await _uploadService.uploadPdf(
      folder: 'prescriptions',
    );
    print('Prescription: $url');
  }

  Future<void> uploadXRayImage() async {
    // Upload image (X-ray, scan, etc.)
    final url = await _uploadService.uploadImage(
      folder: 'medical_images',
    );
    print('X-ray: $url');
  }

  Future<void> uploadTestReport() async {
    // Upload test report PDF
    final url = await _uploadService.uploadPdf(
      folder: 'test_reports',
    );
    print('Test report: $url');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Upload Types')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton.icon(
              onPressed: uploadPrescription,
              icon: const Icon(Icons.medication),
              label: const Text('Upload Prescription PDF'),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: uploadXRayImage,
              icon: const Icon(Icons.image),
              label: const Text('Upload X-Ray Image'),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: uploadTestReport,
              icon: const Icon(Icons.science),
              label: const Text('Upload Test Report PDF'),
            ),
          ],
        ),
      ),
    );
  }
}


/*

FOLDER STRUCTURE IN CLOUDINARY:
================================

After uploads, your Cloudinary will look like:

patient_documents/
├── prescriptions/
│   ├── 1732876543_prescription_abc123.pdf
│   └── 1732876600_prescription_def456.pdf
├── test_reports/
│   ├── 1732876700_blood_test.pdf
│   └── 1732876800_urine_test.pdf
└── medical_images/
    ├── 1732876900_xray.jpg
    └── 1732877000_ct_scan.jpg


URLs GENERATED:
===============

https://res.cloudinary.com/samruddhi-health/raw/upload/v1732876543/prescriptions/1732876543_prescription_abc123.pdf
https://res.cloudinary.com/samruddhi-health/raw/upload/v1732876700/test_reports/1732876700_blood_test.pdf
https://res.cloudinary.com/samruddhi-health/image/upload/v1732876900/medical_images/1732876900_xray.jpg

✅ All URLs are:
- Public (accessible for LLM/OCR)
- Permanent (never expire)
- CDN-delivered (fast worldwide)
- HTTPS secure


NEXT STEPS:
===========

1. Setup Cloudinary account (FREE): https://cloudinary.com/users/register_free
2. Create upload preset: "patient_documents" (unsigned)
3. Update upload_service.dart with your credentials
4. Run: flutter pub get
5. Test upload with PdfUploadButton widget
6. Use URLs for LLM/OCR/RAG processing!

*/
