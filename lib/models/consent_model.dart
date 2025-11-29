class ConsentModel {
  final String? id;
  final String? patientId;
  final String? hospitalId;
  final String hospitalName;
  final DateTime expiresAt;
  final String status; // 'granted', 'revoked', 'expired'
  final String? consentToken;
  final String? qrCodeUrl;
  final DateTime? createdAt;
  final DateTime? revokedAt;

  ConsentModel({
    this.id,
    this.patientId,
    this.hospitalId,
    required this.hospitalName,
    required this.expiresAt,
    required this.status,
    this.consentToken,
    this.qrCodeUrl,
    this.createdAt,
    this.revokedAt,
  });

  ConsentModel copyWith({
    String? id,
    String? patientId,
    String? hospitalId,
    String? hospitalName,
    DateTime? expiresAt,
    String? status,
    String? consentToken,
    String? qrCodeUrl,
    DateTime? createdAt,
    DateTime? revokedAt,
  }) {
    return ConsentModel(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      hospitalId: hospitalId ?? this.hospitalId,
      hospitalName: hospitalName ?? this.hospitalName,
      expiresAt: expiresAt ?? this.expiresAt,
      status: status ?? this.status,
      consentToken: consentToken ?? this.consentToken,
      qrCodeUrl: qrCodeUrl ?? this.qrCodeUrl,
      createdAt: createdAt ?? this.createdAt,
      revokedAt: revokedAt ?? this.revokedAt,
    );
  }

  // JSON serialization
  factory ConsentModel.fromJson(Map<String, dynamic> json) {
    return ConsentModel(
      id: json['id'],
      patientId: json['patient_id'],
      hospitalId: json['hospital_id'],
      hospitalName: json['hospital_name'] ?? json['hospitalName'] ?? 'Unknown Hospital',
      expiresAt: json['expires_at'] != null
          ? DateTime.parse(json['expires_at'])
          : DateTime.now().add(const Duration(days: 1)),
      status: json['status'] ?? 'pending',
      consentToken: json['consent_token'],
      qrCodeUrl: json['qr_code_url'],
      createdAt: json['created_at'] != null || json['granted_at'] != null
          ? DateTime.parse(json['created_at'] ?? json['granted_at'])
          : null,
      revokedAt: json['revoked_at'] != null
          ? DateTime.parse(json['revoked_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      if (patientId != null) 'patient_id': patientId,
      if (hospitalId != null) 'hospital_id': hospitalId,
      'hospital_name': hospitalName,
      'expires_at': expiresAt.toIso8601String(),
      'status': status,
      if (consentToken != null) 'consent_token': consentToken,
      if (qrCodeUrl != null) 'qr_code_url': qrCodeUrl,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (revokedAt != null) 'revoked_at': revokedAt!.toIso8601String(),
    };
  }
}

