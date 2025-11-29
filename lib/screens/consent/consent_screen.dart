import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../providers/consent_provider.dart';
import '../../widgets/consent_tile.dart';
import '../../widgets/primary_button.dart';
import '../../models/consent_model.dart';

class ConsentScreen extends ConsumerStatefulWidget {
  const ConsentScreen({super.key});

  @override
  ConsumerState<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends ConsumerState<ConsentScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _hospitalController = TextEditingController();
  String _duration = '24 hours';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final consentState = ref.watch(consentProvider);
    final consents = consentState.consents;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Consent Management'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Grant Access'),
            Tab(text: 'Active Consents'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildGrantAccess(),
          _buildActiveConsents(consents),
        ],
      ),
    );
  }

  Widget _buildGrantAccess() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildStepCard(
            step: '1',
            title: 'Enter Hospital ID',
            child: TextField(
              controller: _hospitalController,
              decoration: const InputDecoration(
                hintText: 'e.g., Apollo Hospital',
                border: OutlineInputBorder(),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildStepCard(
            step: '2',
            title: 'Select Duration',
            child: DropdownButtonFormField<String>(
              value: _duration,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
              ),
              items: ['24 hours', '48 hours', '7 days'].map((d) {
                return DropdownMenuItem(value: d, child: Text(d));
              }).toList(),
              onChanged: (val) => setState(() => _duration = val!),
            ),
          ),
          const SizedBox(height: 16),
          _buildStepCard(
            step: '3',
            title: 'Generate OTP',
            child: PrimaryButton(
              label: 'Generate OTP',
              onPressed: () {
                if (_hospitalController.text.isEmpty) {
                  Fluttertoast.showToast(msg: 'Enter hospital ID');
                  return;
                }
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    content: Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C853).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF00C853)),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle, color: Color(0xFF00C853), size: 40),
                          const SizedBox(height: 8),
                          Text(
                            'OTP: ${AppConstants.mockOTP}',
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                          ),
                          const Text('Valid for 15 min'),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () {
                          ref.read(consentProvider.notifier).addConsent(
                            ConsentModel(
                              hospitalName: _hospitalController.text,
                              expiresAt: DateTime.now().add(const Duration(days: 1)),
                              status: 'active',
                            ),
                          );
                          Navigator.pop(context);
                          _tabController.animateTo(1);
                        },
                        child: const Text('OK'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard({required String step, required String title, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE3E8EF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 12,
                backgroundColor: const Color(0xFF1E88E5),
                child: Text(step, style: const TextStyle(color: Colors.white, fontSize: 12)),
              ),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _buildActiveConsents(List<ConsentModel> consents) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: consents.length,
      itemBuilder: (context, index) {
        final consent = consents[index];
        return ConsentTile(
          consent: consent,
          onRevoke: () {
            // Revoke consent using ID and reason
            final consentId = consent.id ?? '';
            if (consentId.isNotEmpty) {
              ref.read(consentProvider.notifier).revokeConsent(
                consentId,
                'Revoked by user',
              );
              Fluttertoast.showToast(msg: 'Access revoked');
            }
          },
        );
      },
    );
  }
}
