/// Mock health records data for testing UI
class HealthRecord {
  final String id;
  final String type; // 'lab_test', 'imaging', 'medical_history', 'vaccination'
  final String title;
  final String date;
  final String? hospital;
  final String? doctorName;
  final String? pdfUrl;
  final Map<String, dynamic>? details;
  final DateTime addedAt;

  HealthRecord({
    required this.id,
    required this.type,
    required this.title,
    required this.date,
    this.hospital,
    this.doctorName,
    this.pdfUrl,
    this.details,
    required this.addedAt,
  });
}

class MockHealthRecords {
  static List<HealthRecord> getMockRecords() {
    return [
      // Lab Tests
      HealthRecord(
        id: 'lab_1',
        type: 'lab_test',
        title: 'Complete Blood Count (CBC)',
        date: '2025-11-27',
        hospital: 'Apollo Diagnostics',
        doctorName: 'Dr. Rajesh Kumar',
        pdfUrl: 'private/user-uuid/lab_cbc_1.pdf',
        details: {
          'hemoglobin': '14.5 g/dL',
          'wbc_count': '7,500 cells/µL',
          'platelet_count': '2,50,000 cells/µL',
          'status': 'Normal',
        },
        addedAt: DateTime.now().subtract(Duration(days: 2)),
      ),
      HealthRecord(
        id: 'lab_2',
        type: 'lab_test',
        title: 'Lipid Profile',
        date: '2025-11-20',
        hospital: 'Fortis Diagnostics',
        doctorName: 'Dr. Priya Sharma',
        pdfUrl: 'private/user-uuid/lab_lipid_2.pdf',
        details: {
          'total_cholesterol': '190 mg/dL',
          'ldl': '110 mg/dL',
          'hdl': '55 mg/dL',
          'triglycerides': '125 mg/dL',
          'status': 'Borderline High',
        },
        addedAt: DateTime.now().subtract(Duration(days: 9)),
      ),
      HealthRecord(
        id: 'lab_3',
        type: 'lab_test',
        title: 'HbA1c Test',
        date: '2025-11-18',
        hospital: 'Max Diagnostics',
        doctorName: 'Dr. Amit Patel',
        pdfUrl: null,
        details: {
          'hba1c': '6.8%',
          'average_glucose': '148 mg/dL',
          'status': 'Pre-diabetic',
        },
        addedAt: DateTime.now().subtract(Duration(days: 11)),
      ),

      // Imaging Reports
      HealthRecord(
        id: 'img_1',
        type: 'imaging',
        title: 'Chest X-Ray',
        date: '2025-11-22',
        hospital: 'Manipal Imaging Center',
        doctorName: 'Dr. Sunita Reddy',
        pdfUrl: 'private/user-uuid/xray_chest_1.pdf',
        details: {
          'findings': 'Clear lung fields, no abnormalities detected',
          'impression': 'Normal chest X-ray',
        },
        addedAt: DateTime.now().subtract(Duration(days: 7)),
      ),
      HealthRecord(
        id: 'img_2',
        type: 'imaging',
        title: 'Brain MRI',
        date: '2025-11-10',
        hospital: 'Apollo Imaging',
        doctorName: 'Dr. Sunita Reddy',
        pdfUrl: 'private/user-uuid/mri_brain_2.pdf',
        details: {
          'findings': 'No acute intracranial abnormality',
          'impression': 'Normal brain MRI',
        },
        addedAt: DateTime.now().subtract(Duration(days: 19)),
      ),

      // Vaccinations
      HealthRecord(
        id: 'vac_1',
        type: 'vaccination',
        title: 'COVID-19 Booster',
        date: '2025-10-15',
        hospital: 'Primary Health Center',
        doctorName: null,
        pdfUrl: null,
        details: {
          'vaccine_name': 'Covishield',
          'dose_number': '3',
          'batch_number': 'ABC123456',
        },
        addedAt: DateTime.now().subtract(Duration(days: 45)),
      ),
      HealthRecord(
        id: 'vac_2',
        type: 'vaccination',
        title: 'Influenza Vaccine',
        date: '2025-09-01',
        hospital: 'Apollo Hospital',
        doctorName: null,
        pdfUrl: null,
        details: {
          'vaccine_name': 'Flu Vaccine 2025',
          'dose_number': '1',
          'batch_number': 'FLU2025789',
        },
        addedAt: DateTime.now().subtract(Duration(days: 89)),
      ),

      // Medical History
      HealthRecord(
        id: 'hist_1',
        type: 'medical_history',
        title: 'Annual Health Checkup',
        date: '2025-08-15',
        hospital: 'Fortis Healthcare',
        doctorName: 'Dr. Priya Sharma',
        pdfUrl: 'private/user-uuid/checkup_annual_1.pdf',
        details: {
          'bp': '130/85 mmHg',
          'weight': '72 kg',
          'height': '170 cm',
          'bmi': '24.9',
          'overall_health': 'Good',
        },
        addedAt: DateTime.now().subtract(Duration(days: 106)),
      ),
    ];
  }
}
