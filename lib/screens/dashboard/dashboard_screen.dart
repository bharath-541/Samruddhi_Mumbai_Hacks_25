import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/record_provider.dart';
import '../../providers/consent_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../widgets/custom_bottom_nav_bar.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reset to home when returning to dashboard
    if (_selectedIndex != 0) {
      setState(() => _selectedIndex = 0);
    }
  }

  void _onItemTapped(int index) {
    if (index == 0) {
      // Already on home, do nothing
      return;
    }
    
    setState(() => _selectedIndex = index);
    switch (index) {
      case 1:
        context.push('/records').then((_) {
          if (mounted) setState(() => _selectedIndex = 0);
        });
        break;
      case 2:
        context.push('/timeline').then((_) {
          if (mounted) setState(() => _selectedIndex = 0);
        });
        break;
      case 3:
        context.push('/devices').then((_) {
          if (mounted) setState(() => _selectedIndex = 0);
        });
        break;
      case 4:
        // SIA Assistant
        context.push('/sia-assistant').then((_) {
          if (mounted) setState(() => _selectedIndex = 0);
        });
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final recordState = ref.watch(recordProvider);
    final records = recordState.records;
    final consentState = ref.watch(consentProvider);
    final consents = consentState.consents;
    final activeConsents = consents.where((c) => c.status == 'active').length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              expandedHeight: 120,
              flexibleSpace: FlexibleSpaceBar(
                background: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hey there! 👋',
                                style: GoogleFonts.poppins(
                                  fontSize: 16,
                                  color: Colors.grey[600],
                                ),
                              ),
                              Text(
                                'Your Health Hub',
                                style: GoogleFonts.poppins(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                  color: Colors.black,
                                ),
                              ),
                            ],
                          ),
                          Container(
                            decoration: BoxDecoration(
                              gradient: AppColors.gradientPurple,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primary.withAlpha(80),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.person, color: Colors.white),
                              onPressed: () => context.push('/profile'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.all(20),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  Row(
                    children: [
                      Expanded(
                        child: _buildGradientCard(
                          gradient: AppColors.gradientPurple,
                          icon: Icons.folder_rounded,
                          value: '${records.length}',
                          label: 'Records',
                          onTap: () => context.push('/records'),
                        ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.2),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildGradientCard(
                          gradient: AppColors.gradientGreen,
                          icon: Icons.verified_user_rounded,
                          value: '$activeConsents',
                          label: 'Active',
                          onTap: () => context.push('/consent'),
                        ).animate().fadeIn(duration: 400.ms, delay: 100.ms).slideX(begin: 0.2),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Text(
                    '⚡ Quick Actions',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildActionCard(
                    icon: Icons.upload_file_rounded,
                    title: 'Add Prescription',
                    subtitle: 'Upload prescription with PDF',
                    gradient: AppColors.gradientPurple,
                    onTap: () => context.push('/add-prescription'),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
                  const SizedBox(height: 12),
                  _buildActionCard(
                    icon: Icons.share_rounded,
                    title: 'Grant Access',
                    subtitle: 'Share with healthcare provider',
                    gradient: AppColors.gradientGreen,
                    onTap: () => context.push('/consent'),
                  ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1),
                  const SizedBox(height: 12),
                  _buildActionCard(
                    icon: Icons.timeline_rounded,
                    title: 'View Timeline',
                    subtitle: 'Your health journey',
                    gradient: AppColors.gradientPink,
                    onTap: () => context.push('/timeline'),
                  ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),
                  const SizedBox(height: 100),
                ]),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: CustomBottomNavBar(
        selectedIndex: _selectedIndex,
        onItemTapped: _onItemTapped,
      ),
    );
  }

  Widget _buildGradientCard({
    required Gradient gradient,
    required IconData icon,
    required String value,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: gradient,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: gradient.colors.first.withAlpha(60),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: Colors.white, size: 32),
            const SizedBox(height: 12),
            Text(
              value,
              style: GoogleFonts.poppins(
                fontSize: 32,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 14,
                color: Colors.white.withAlpha(230),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Gradient gradient,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
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
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                gradient: gradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: Colors.white, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
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
            Icon(Icons.arrow_forward_ios_rounded, size: 18, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }
}
