import '../models/record_model.dart';

final mockRecords = [
  RecordModel(
    id: 'R001',
    title: 'Lab Report - Apollo',
    type: 'Report',
    uploadedAt: DateTime(2025, 11, 10),
  ),
  RecordModel(
    id: 'R002',
    title: 'Prescription - Fortis',
    type: 'Prescription',
    uploadedAt: DateTime(2025, 11, 5),
  ),
  RecordModel(
    id: 'R003',
    title: 'X-Ray - Max Hospital',
    type: 'Imaging',
    uploadedAt: DateTime(2025, 10, 28),
  ),
];
