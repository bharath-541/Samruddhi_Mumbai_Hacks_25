class RecordModel {
  final String id;
  final String title;
  final String type;
  final DateTime uploadedAt;

  RecordModel({
    required this.id,
    required this.title,
    required this.type,
    required this.uploadedAt,
  });

  // JSON serialization
  factory RecordModel.fromJson(Map<String, dynamic> json) {
    return RecordModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      type: json['type'] ?? '',
      uploadedAt: json['uploaded_at'] != null
          ? DateTime.parse(json['uploaded_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'type': type,
      'uploaded_at': uploadedAt.toIso8601String(),
    };
  }
}
