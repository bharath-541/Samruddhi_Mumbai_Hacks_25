import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../widgets/pdf_upload_button.dart';
import '../../services/prescription_service.dart';
import '../../models/prescription.dart';

/// Add Prescription Screen
/// Allows patients to add prescriptions to their EHR with PDF upload
class AddPrescriptionScreen extends ConsumerStatefulWidget {
  const AddPrescriptionScreen({super.key});

  @override
  ConsumerState<AddPrescriptionScreen> createState() => _AddPrescriptionScreenState();
}

class _AddPrescriptionScreenState extends ConsumerState<AddPrescriptionScreen> {
  final _formKey = GlobalKey<FormState>();
  final PrescriptionService _prescriptionService = PrescriptionService();
  
  // Form fields
  final _doctorNameController = TextEditingController();
  final _hospitalNameController = TextEditingController();
  final _diagnosisController = TextEditingController();
  final _medicationNameController = TextEditingController();
  final _dosageController = TextEditingController();
  final _frequencyController = TextEditingController();
  final _durationController = TextEditingController();
  final _notesController = TextEditingController();
  
  DateTime _selectedDate = DateTime.now();
  String? _pdfUrl;
  bool _isSubmitting = false;
  
  final List<Map<String, String>> _medications = [];

  @override
  void dispose() {
    _doctorNameController.dispose();
    _hospitalNameController.dispose();
    _diagnosisController.dispose();
    _medicationNameController.dispose();
    _dosageController.dispose();
    _frequencyController.dispose();
    _durationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addMedication() {
    if (_medicationNameController.text.isEmpty || _dosageController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please enter medication name and dosage'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _medications.add({
        'name': _medicationNameController.text,
        'dosage': _dosageController.text,
        'frequency': _frequencyController.text,
        'duration': _durationController.text,
        'notes': _notesController.text,
      });
      
      // Clear medication fields
      _medicationNameController.clear();
      _dosageController.clear();
      _frequencyController.clear();
      _durationController.clear();
      _notesController.clear();
    });
  }

  void _removeMedication(int index) {
    setState(() {
      _medications.removeAt(index);
    });
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _submitPrescription() async {
    print('🔘 Submit button clicked');
    
    if (!_formKey.currentState!.validate()) {
      print('❌ Form validation failed');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in required fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }
    
    if (_medications.isEmpty) {
      print('❌ No medications added');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one medication'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    print('✅ Form valid, submitting...');
    setState(() => _isSubmitting = true);

    try {
      print('🔍 Submitting prescription...');
      
      // Create prescription object
      final prescription = Prescription(
        date: _selectedDate.toIso8601String().split('T')[0], // Format: YYYY-MM-DD
        doctorName: _doctorNameController.text,
        hospitalName: _hospitalNameController.text.isNotEmpty ? _hospitalNameController.text : null,
        diagnosis: _diagnosisController.text.isNotEmpty ? _diagnosisController.text : null,
        medications: _medications.map((med) => Medication(
          name: med['name']!,
          dosage: med['dosage']!,
          frequency: med['frequency']!,
          duration: med['duration']!,
          notes: med['notes']?.isNotEmpty == true ? med['notes'] : null,
        )).toList(),
        pdfUrl: _pdfUrl,
        addedBy: 'patient',
        addedAt: DateTime.now(),
      );
      
      await _prescriptionService.addPrescription(prescription);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Prescription added successfully!'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Prescription'),
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Date Selector
            Card(
              child: ListTile(
                leading: const Icon(Icons.calendar_today),
                title: const Text('Prescription Date'),
                subtitle: Text(
                  '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                ),
                trailing: const Icon(Icons.edit),
                onTap: _selectDate,
              ),
            ),
            const SizedBox(height: 16),

            // Doctor Name
            TextFormField(
              controller: _doctorNameController,
              decoration: const InputDecoration(
                labelText: 'Doctor Name *',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter doctor name';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Hospital Name
            TextFormField(
              controller: _hospitalNameController,
              decoration: const InputDecoration(
                labelText: 'Hospital Name',
                prefixIcon: Icon(Icons.local_hospital),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // Diagnosis
            TextFormField(
              controller: _diagnosisController,
              decoration: const InputDecoration(
                labelText: 'Diagnosis',
                prefixIcon: Icon(Icons.medical_services),
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 24),

            // Medications Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.medication, color: Colors.blue),
                        const SizedBox(width: 8),
                        const Text(
                          'Medications',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const Spacer(),
                        Text(
                          '${_medications.length} added',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Medication Input Fields
                    TextFormField(
                      controller: _medicationNameController,
                      decoration: const InputDecoration(
                        labelText: 'Medication Name *',
                        hintText: 'e.g., Metformin',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _dosageController,
                            decoration: const InputDecoration(
                              labelText: 'Dosage *',
                              hintText: 'e.g., 500mg',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _frequencyController,
                            decoration: const InputDecoration(
                              labelText: 'Frequency',
                              hintText: 'e.g., Twice daily',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    
                    TextFormField(
                      controller: _durationController,
                      decoration: const InputDecoration(
                        labelText: 'Duration',
                        hintText: 'e.g., 30 days',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    TextFormField(
                      controller: _notesController,
                      decoration: const InputDecoration(
                        labelText: 'Notes',
                        hintText: 'e.g., Take with meals',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    ElevatedButton.icon(
                      onPressed: _addMedication,
                      icon: const Icon(Icons.add),
                      label: const Text('Add Medication'),
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size(double.infinity, 48),
                      ),
                    ),
                    
                    // List of added medications
                    if (_medications.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 8),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _medications.length,
                        itemBuilder: (context, index) {
                          final med = _medications[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              title: Text(med['name'] ?? ''),
                              subtitle: Text(
                                'Dosage: ${med['dosage']}\n'
                                '${med['frequency']?.isNotEmpty == true ? "Frequency: ${med['frequency']}\n" : ""}'
                                '${med['duration']?.isNotEmpty == true ? "Duration: ${med['duration']}" : ""}',
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, color: Colors.red),
                                onPressed: () => _removeMedication(index),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // PDF Upload Section
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.picture_as_pdf, color: Colors.red),
                        const SizedBox(width: 8),
                        const Text(
                          'Prescription Document',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Upload a PDF copy of your prescription (optional)',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    PdfUploadButton(
                      buttonText: _pdfUrl == null ? 'Upload PDF' : 'Change PDF',
                      icon: _pdfUrl == null ? Icons.upload_file : Icons.check_circle,
                      backgroundColor: _pdfUrl == null ? null : Colors.green,
                      onUploadSuccess: (url) {
                        setState(() {
                          _pdfUrl = url;
                        });
                      },
                    ),
                    
                    if (_pdfUrl != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.check_circle, color: Colors.green, size: 16),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              'PDF uploaded successfully',
                              style: TextStyle(
                                color: Colors.grey[700],
                                fontSize: 12,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              setState(() {
                                _pdfUrl = null;
                              });
                            },
                            child: const Text('Remove'),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),

            // Submit Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitPrescription,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text(
                      'Add Prescription',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
