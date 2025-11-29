class HospitalModel {
  final String id;
  final String name;
  final String type; // government, private, charitable
  final String tier; // primary, secondary, tertiary, quaternary
  final String? address;
  final String? phone;
  final String? email;
  final double? lat;
  final double? lon;
  final DateTime? createdAt;

  HospitalModel({
    required this.id,
    required this.name,
    required this.type,
    required this.tier,
    this.address,
    this.phone,
    this.email,
    this.lat,
    this.lon,
    this.createdAt,
  });

  // JSON serialization
  factory HospitalModel.fromJson(Map<String, dynamic> json) {
    return HospitalModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'government',
      tier: json['tier'] ?? 'primary',
      address: json['address'],
      phone: json['phone'],
      email: json['email'],
      lat: json['lat']?.toDouble(),
      lon: json['lon']?.toDouble(),
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'tier': tier,
      if (address != null) 'address': address,
      if (phone != null) 'phone': phone,
      if (email != null) 'email': email,
      if (lat != null) 'lat': lat,
      if (lon != null) 'lon': lon,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
    };
  }
}
