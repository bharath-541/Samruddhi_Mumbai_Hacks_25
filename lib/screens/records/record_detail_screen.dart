import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:intl/intl.dart';
import '../../providers/record_provider.dart';
import '../../widgets/primary_button.dart';

class RecordDetailScreen extends ConsumerWidget {
  final String recordId;

  const RecordDetailScreen({super.key, required this.recordId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recordState = ref.watch(recordProvider);
    final records = recordState.records;
    final record = records.firstWhere((r) => r.id == recordId);

    return Scaffold(
      appBar: AppBar(title: const Text('Record Details')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      record.title,
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text('Type: ${record.type}'),
                    Text('Uploaded: ${DateFormat('MMM dd, yyyy').format(record.uploadedAt)}'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Container(
              height: 200,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Center(
                child: Icon(Icons.description, size: 80, color: Colors.grey),
              ),
            ),
            const Spacer(),
            PrimaryButton(
              label: 'Download',
              onPressed: () => Fluttertoast.showToast(msg: 'Download started'),
            ),
            const SizedBox(height: 12),
            PrimaryButton(
              label: 'Share',
              onPressed: () => Fluttertoast.showToast(msg: 'Share options'),
            ),
          ],
        ),
      ),
    );
  }
}
