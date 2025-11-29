import '../models/prescription.dart';
import '../mock/mock_prescription_data.dart';

class PrescriptionService {
  /// Fetch all prescriptions (using mock data)
  Future<List<Prescription>> getMyPrescriptions() async {
    try {
      print('📋 Fetching prescriptions (mock data)...');
      
      // Simulate network delay
      await Future.delayed(Duration(milliseconds: 500));
      
      final prescriptions = MockPrescriptionData.getMockPrescriptions();
      
      print('✅ Fetched ${prescriptions.length} mock prescriptions');
      return prescriptions;
    } catch (e) {
      print('❌ Error fetching prescriptions: $e');
      rethrow;
    }
  }

  /// Add a new prescription (mock - just simulates success)
  Future<bool> addPrescription(Prescription prescription) async {
    try {
      print('📝 Submitting prescription (mock)...');
      
      // Simulate network delay
      await Future.delayed(Duration(milliseconds: 800));
      
      print('✅ Prescription added successfully (mock)');
      return true;
    } catch (e) {
      print('❌ Error adding prescription: $e');
      rethrow;
    }
  }
}
