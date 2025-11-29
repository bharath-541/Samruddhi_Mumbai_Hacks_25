import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/record_model.dart';

class RecordCard extends StatelessWidget {
  final RecordModel record;
  final VoidCallback onTap;

  const RecordCard({
    super.key,
    required this.record,
    required this.onTap,
  });

  IconData _getIcon() {
    switch (record.type) {
      case 'Report':
        return Icons.description_outlined;
      case 'Prescription':
        return Icons.medication_outlined;
      case 'Imaging':
        return Icons.image_outlined;
      default:
        return Icons.file_present_outlined;
    }
  }

  Color _getChipColor() {
    switch (record.type) {
      case 'Report':
        return const Color(0xFF1E88E5);
      case 'Prescription':
        return const Color(0xFF00C853);
      case 'Imaging':
        return const Color(0xFFFF6F00);
      default:
        return const Color(0xFF6C757D);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE3E8EF)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: EdgeInsets.zero,
        leading: Icon(_getIcon(), size: 32, color: _getChipColor()),
        title: Text(record.title),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(DateFormat('MMM dd, yyyy').format(record.uploadedAt)),
            const SizedBox(height: 8),
            Chip(
              label: Text(record.type, style: const TextStyle(fontSize: 12)),
              backgroundColor: Color.alphaBlend(_getChipColor().withAlpha(25), Colors.white),
              labelStyle: TextStyle(color: _getChipColor(), fontWeight: FontWeight.w500),
              padding: EdgeInsets.zero,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
