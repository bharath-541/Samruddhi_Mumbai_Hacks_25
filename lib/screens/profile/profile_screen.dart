import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../providers/profile_provider.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _bloodGroupController;
  late TextEditingController _emergencyController;

  @override
  void initState() {
    super.initState();
    final profileState = ref.read(profileProvider);
    final profile = profileState.profile!;
    _nameController = TextEditingController(text: profile.name);
    _emailController = TextEditingController(text: profile.email);
    _phoneController = TextEditingController(text: profile.phone);
    _bloodGroupController = TextEditingController(text: profile.bloodGroup);
    _emergencyController = TextEditingController(text: profile.emergencyContact);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFF1E88E5), width: 3),
              ),
              child: const CircleAvatar(
                radius: 50,
                backgroundColor: Color(0xFFF5FAFF),
                child: Icon(Icons.person, size: 50, color: Color(0xFF1E88E5)),
              ),
            ),
            const SizedBox(height: 24),
            _buildInfoField('Name', _nameController),
            const SizedBox(height: 16),
            _buildInfoField('Email', _emailController),
            const SizedBox(height: 16),
            _buildInfoField('Phone', _phoneController),
            const SizedBox(height: 16),
            _buildInfoField('Blood Group', _bloodGroupController),
            const SizedBox(height: 16),
            _buildInfoField('Emergency Contact', _emergencyController),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: () {
                final currentProfile = ref.read(profileProvider).profile!;
                final patientId = currentProfile.id ?? '';
                if (patientId.isNotEmpty) {
                  ref.read(profileProvider.notifier).updateProfile(
                    patientId,
                    currentProfile.copyWith(
                      name: _nameController.text,
                      email: _emailController.text,
                      phone: _phoneController.text,
                      bloodGroup: _bloodGroupController.text,
                      emergencyContact: _emergencyController.text,
                    ),
                  );
                  Fluttertoast.showToast(msg: 'Profile updated successfully');
                } else {
                  Fluttertoast.showToast(msg: 'Patient ID not available');
                }
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF1E88E5),
                side: const BorderSide(color: Color(0xFF1E88E5)),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              ),
              child: const Text('Edit Profile'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoField(String label, TextEditingController controller) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE3E8EF)),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: label,
          border: InputBorder.none,
        ),
      ),
    );
  }
}
