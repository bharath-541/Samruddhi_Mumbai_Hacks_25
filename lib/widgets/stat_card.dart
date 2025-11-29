import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text.dart';

class StatCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final String value;

  const StatCard({
    super.key,
    required this.title,
    required this.icon,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.primary, size: 32),
            const SizedBox(height: 12),
            Text(value, style: AppText.headline),
            const SizedBox(height: 4),
            Text(title, style: AppText.caption),
          ],
        ),
      ),
    );
  }
}
