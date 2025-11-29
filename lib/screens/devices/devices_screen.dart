import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_theme.dart';

class DevicesScreen extends StatelessWidget {
  const DevicesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back_rounded),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '🔗 IoT Devices',
                        style: GoogleFonts.poppins(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.only(left: 56),
                    child: Text(
                      'Connect your health gadgets',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _DeviceCard(
                    icon: '⌚',
                    name: 'Smart Watch',
                    subtitle: 'Heart rate, Steps, Sleep',
                    isConnected: false,
                    gradient: AppColors.gradientPurple,
                  ).animate().fadeIn(delay: 100.ms).slideX(begin: -0.2),
                  const SizedBox(height: 12),
                  _DeviceCard(
                    icon: '⚖️',
                    name: 'Smart Scale',
                    subtitle: 'Weight, BMI, Body fat',
                    isConnected: false,
                    gradient: AppColors.gradientGreen,
                  ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.2),
                  const SizedBox(height: 12),
                  _DeviceCard(
                    icon: '💍',
                    name: 'Smart Ring',
                    subtitle: 'SpO2, Temperature',
                    isConnected: false,
                    gradient: AppColors.gradientPink,
                  ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.2),
                  const SizedBox(height: 12),
                  _DeviceCard(
                    icon: '🩺',
                    name: 'BP Monitor',
                    subtitle: 'Blood pressure tracking',
                    isConnected: false,
                    gradient: AppColors.gradientPurple,
                  ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.2),
                  const SizedBox(height: 12),
                  _DeviceCard(
                    icon: '🩸',
                    name: 'Glucometer',
                    subtitle: 'Blood sugar levels',
                    isConnected: false,
                    gradient: AppColors.gradientGreen,
                  ).animate().fadeIn(delay: 500.ms).slideX(begin: -0.2),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DeviceCard extends StatelessWidget {
  final String icon;
  final String name;
  final String subtitle;
  final bool isConnected;
  final Gradient gradient;

  const _DeviceCard({
    required this.icon,
    required this.name,
    required this.subtitle,
    required this.isConnected,
    required this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(icon, style: const TextStyle(fontSize: 32)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: isConnected ? AppColors.gradientGreen : null,
              color: isConnected ? null : Colors.grey[200],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              isConnected ? 'Connected' : 'Connect',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isConnected ? Colors.white : Colors.grey[600],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
