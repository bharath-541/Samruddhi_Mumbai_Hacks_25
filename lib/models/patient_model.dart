class PatientModel {
  final String? id; // Patient ID from backend
  final String name;
  final String email;
  final String phone;
  final String bloodGroup;
  final String emergencyContact;

  PatientModel({
    this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.bloodGroup,
    required this.emergencyContact,
  });

  PatientModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? bloodGroup,
    String? emergencyContact,
  }) {
    return PatientModel(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      bloodGroup: bloodGroup ?? this.bloodGroup,
      emergencyContact: emergencyContact ?? this.emergencyContact,
    );
  }

  // JSON serialization
  factory PatientModel.fromJson(Map<String, dynamic> json) {
    return PatientModel(
      id: json['id']?.toString(),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      bloodGroup: json['blood_group'] ?? json['bloodGroup'] ?? '',
      emergencyContact: json['emergency_contact'] ?? json['emergencyContact'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'blood_group': bloodGroup,
      'emergency_contact': emergencyContact,
    };
  }
}
