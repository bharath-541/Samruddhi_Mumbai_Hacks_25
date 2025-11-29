import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/consent_model.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_text.dart';

class ConsentTile extends StatelessWidget {
  final ConsentModel consent;
  final VoidCallback onRevoke;

  const ConsentTile({
    super.key,
    required this.consent,
    required this.onRevoke,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = consent.status == 'active';
    return Card(
      color: isActive ? Colors.white : Colors.grey[200],
      child: ListTile(
        leading: Icon(
          Icons.local_hospital,
          color: isActive ? AppColors.primary : Colors.grey,
        ),
        title: Text(consent.hospitalName, style: AppText.body),
        subtitle: Text(
          'Expires: ${DateFormat('MMM dd, yyyy').format(consent.expiresAt)}',
          style: AppText.caption,
        ),
        trailing: isActive
            ? TextButton(
                onPressed: onRevoke,
                child: const Text('Revoke'),
              )
            : Text('Revoked', style: AppText.caption),
      ),
    );
  }
}
