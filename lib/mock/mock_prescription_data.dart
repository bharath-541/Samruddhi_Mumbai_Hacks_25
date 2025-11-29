import '../models/prescription.dart';

/// Mock prescription data for testing UI while backend is being fixed
class MockPrescriptionData {
  static List<Prescription> getMockPrescriptions() {
    return [
      Prescription(
        id: '1',
        date: '2025-11-28',
        doctorName: 'Dr. Rajesh Kumar',
        hospitalName: 'Apollo Hospital',
        diagnosis: 'Viral Fever',
        medications: [
          Medication(
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '5 days',
            notes: 'Take after food',
          ),
          Medication(
            name: 'Cetirizine',
            dosage: '10mg',
            frequency: 'Once daily',
            duration: '3 days',
            notes: 'Before bedtime',
          ),
        ],
        pdfUrl: 'private/user-uuid/prescription_1.pdf',
        addedBy: 'patient',
        addedAt: DateTime.now().subtract(Duration(days: 1)),
      ),
      Prescription(
        id: '2',
        date: '2025-11-25',
        doctorName: 'Dr. Priya Sharma',
        hospitalName: 'Fortis Healthcare',
        diagnosis: 'Hypertension',
        medications: [
          Medication(
            name: 'Amlodipine',
            dosage: '5mg',
            frequency: 'Once daily',
            duration: '30 days',
            notes: 'Take in the morning',
          ),
        ],
        pdfUrl: null,
        addedBy: 'patient',
        addedAt: DateTime.now().subtract(Duration(days: 4)),
      ),
      Prescription(
        id: '3',
        date: '2025-11-20',
        doctorName: 'Dr. Amit Patel',
        hospitalName: 'Max Hospital',
        diagnosis: 'Diabetes Type 2',
        medications: [
          Medication(
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            duration: '60 days',
            notes: 'Take with meals',
          ),
          Medication(
            name: 'Glimepiride',
            dosage: '2mg',
            frequency: 'Once daily',
            duration: '60 days',
            notes: 'Before breakfast',
          ),
        ],
        pdfUrl: 'private/user-uuid/prescription_3.pdf',
        addedBy: 'patient',
        addedAt: DateTime.now().subtract(Duration(days: 9)),
      ),
      Prescription(
        id: '4',
        date: '2025-11-15',
        doctorName: 'Dr. Sunita Reddy',
        hospitalName: 'Manipal Hospital',
        diagnosis: 'Migraine',
        medications: [
          Medication(
            name: 'Sumatriptan',
            dosage: '50mg',
            frequency: 'As needed',
            duration: '30 days',
            notes: 'Take at onset of headache',
          ),
        ],
        pdfUrl: 'private/user-uuid/prescription_4.pdf',
        addedBy: 'patient',
        addedAt: DateTime.now().subtract(Duration(days: 14)),
      ),
    ];
  }
}
