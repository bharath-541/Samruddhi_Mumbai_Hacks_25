class Prescription {
  final String? id;
  final String date;
  final String doctorName;
  final String? hospitalName;
  final String? diagnosis;
  final List<Medication> medications;
  final String? pdfUrl;
  final String addedBy;
  final DateTime addedAt;

  Prescription({
    this.id,
    required this.date,
    required this.doctorName,
    this.hospitalName,
    this.diagnosis,
    required this.medications,
    this.pdfUrl,
    required this.addedBy,
    required this.addedAt,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    return Prescription(
      id: json['id']?.toString(),
      date: json['date'] ?? '',
      doctorName: json['doctor_name'] ?? '',
      hospitalName: json['hospital_name'],
      diagnosis: json['diagnosis'],
      medications: (json['medications'] as List<dynamic>?)
              ?.map((m) => Medication.fromJson(m as Map<String, dynamic>))
              .toList() ??
          [],
      pdfUrl: json['pdf_url'],
      addedBy: json['added_by'] ?? '',
      addedAt: json['added_at'] != null 
          ? DateTime.parse(json['added_at']) 
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'date': date,
      'doctor_name': doctorName,
      if (hospitalName != null) 'hospital_name': hospitalName,
      if (diagnosis != null) 'diagnosis': diagnosis,
      'medications': medications.map((m) => m.toJson()).toList(),
      if (pdfUrl != null) 'pdf_url': pdfUrl,
      'added_by': addedBy,
      'added_at': addedAt.toIso8601String(),
    };
  }
}

class Medication {
  final String name;
  final String dosage;
  final String frequency;
  final String duration;
  final String? notes;

  Medication({
    required this.name,
    required this.dosage,
    required this.frequency,
    required this.duration,
    this.notes,
  });

  factory Medication.fromJson(Map<String, dynamic> json) {
    return Medication(
      name: json['name'] ?? '',
      dosage: json['dosage'] ?? '',
      frequency: json['frequency'] ?? '',
      duration: json['duration'] ?? '',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'dosage': dosage,
      'frequency': frequency,
      'duration': duration,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
    };
  }
}
