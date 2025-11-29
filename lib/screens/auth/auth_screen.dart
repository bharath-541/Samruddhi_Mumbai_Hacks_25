import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/primary_button.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.health_and_safety, size: 80),
            const SizedBox(height: 32),
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            if (_otpSent) ...[
              TextField(
                controller: _otpController,
                decoration: const InputDecoration(
                  labelText: 'Enter OTP',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.lock),
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
            ],
            PrimaryButton(
              label: _otpSent ? 'Verify OTP' : 'Send OTP',
              onPressed: () {
                if (_emailController.text.isEmpty) {
                  Fluttertoast.showToast(msg: 'Please enter email');
                  return;
                }
                if (!_otpSent) {
                  setState(() => _otpSent = true);
                  Fluttertoast.showToast(msg: 'OTP sent: ${AppConstants.mockOTP}');
                } else {
                  if (_otpController.text == AppConstants.mockOTP) {
                    // Navigate to signin screen for real authentication
                    context.go('/signin');
                  } else {
                    Fluttertoast.showToast(msg: 'Invalid OTP');
                  }
                }
              },
            ),
          ],
        ),
      ),
    );
  }
}
