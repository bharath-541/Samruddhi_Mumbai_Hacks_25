import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/record_provider.dart';
import '../../core/theme/app_theme.dart';
import '../../mock/mock_pill_sync.dart';

class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key});

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final recordState = ref.watch(recordProvider);
    final records = recordState.records;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
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
                    '📊 Timeline',
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
              ),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  gradient: AppColors.gradientPurple,
                  borderRadius: BorderRadius.circular(20),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                indicatorPadding: const EdgeInsets.all(6),
                labelColor: Colors.white,
                unselectedLabelColor: Colors.grey[600],
                labelStyle: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
                unselectedLabelStyle: GoogleFonts.poppins(
                  fontWeight: FontWeight.w500,
                  fontSize: 15,
                ),
                padding: const EdgeInsets.all(6),
                tabs: const [
                  Tab(
                    height: 50,
                    text: 'Records',
                  ),
                  Tab(
                    height: 50,
                    text: 'Vitals',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildRecordsTimeline(records),
                  _buildVitalsLog(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecordsTimeline(List records) {
    if (records.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('📁', style: TextStyle(fontSize: 64)),
            SizedBox(height: 16),
            Text('No records yet', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: records.length,
      itemBuilder: (context, index) {
        final record = records[index];
        final isLast = index == records.length - 1;
        
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    gradient: AppColors.gradientPurple,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: AppColors.gradientPurple,
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(8),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(record.title, style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(
                      DateFormat('MMM dd, yyyy').format(record.uploadedAt),
                      style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ).animate(delay: (index * 100).ms).fadeIn().slideX(begin: 0.2);
      },
    );
  }

  Widget _buildVitalsLog() {
    final todayDoses = MockPillSyncData.getTodaysDoses();
    final adherenceStats = MockPillSyncData.getAdherenceStats();
    
    final vitalsByDate = {
      'Today': [
        {'icon': '❤️', 'name': 'Heart Rate', 'value': '72 bpm', 'time': '10:30 AM', 'gradient': AppColors.gradientPink},
        {'icon': '🩸', 'name': 'Blood Pressure', 'value': '120/80 mmHg', 'time': '09:15 AM', 'gradient': AppColors.gradientPurple},
        {'icon': '💧', 'name': 'SpO2', 'value': '98%', 'time': '08:00 AM', 'gradient': AppColors.gradientGreen},
      ],
      'Yesterday': [
        {'icon': '⚖️', 'name': 'Weight', 'value': '70 kg', 'time': '07:00 AM', 'gradient': AppColors.gradientPurple},
        {'icon': '🍬', 'name': 'Blood Sugar', 'value': '95 mg/dL', 'time': '06:30 AM', 'gradient': AppColors.gradientPink},
        {'icon': '❤️', 'name': 'Heart Rate', 'value': '68 bpm', 'time': '10:00 PM', 'gradient': AppColors.gradientPink},
      ],
      'Nov 10, 2025': [
        {'icon': '🩸', 'name': 'Blood Pressure', 'value': '118/78 mmHg', 'time': '09:00 AM', 'gradient': AppColors.gradientPurple},
        {'icon': '💧', 'name': 'SpO2', 'value': '97%', 'time': '08:30 AM', 'gradient': AppColors.gradientGreen},
      ],
    };

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      itemCount: vitalsByDate.length + 1, // +1 for Pill Sync section
      itemBuilder: (context, dateIndex) {
        // First item: Pill Sync Section
        if (dateIndex == 0) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Row(
                  children: [
                    Text(
                      '💊 Pill Sync',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: adherenceStats.adherencePercentage >= 80 
                            ? Colors.green[50] 
                            : Colors.orange[50],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${adherenceStats.adherencePercentage.toStringAsFixed(0)}% Adherence',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: adherenceStats.adherencePercentage >= 80 
                              ? Colors.green[700] 
                              : Colors.orange[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              // Today's doses
              ...todayDoses.asMap().entries.map((entry) {
                final dose = entry.value;
                final status = dose['status'] as String;
                final scheduledTime = dose['scheduledTime'] as DateTime;
                final timeStr = DateFormat('hh:mm a').format(scheduledTime);
                
                Color statusColor;
                String statusIcon;
                if (status == 'taken') {
                  statusColor = Colors.green;
                  statusIcon = '✓';
                } else if (status == 'missed') {
                  statusColor = Colors.red;
                  statusIcon = '✗';
                } else {
                  statusColor = Colors.orange;
                  statusIcon = '○';
                }
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: status == 'pending' ? AppColors.primary.withAlpha(50) : Colors.transparent,
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              gradient: AppColors.gradientPurple,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text('💊', style: TextStyle(fontSize: 24)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${dose['medicineName']} ${dose['dosage']}',
                                  style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  timeStr,
                                  style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
                                ),
                                if (dose['instructions'] != null)
                                  Text(
                                    dose['instructions'] as String,
                                    style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500]),
                                  ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: statusColor.withAlpha(25),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  statusIcon,
                                  style: TextStyle(
                                    color: statusColor,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  status == 'taken' ? 'Taken' : (status == 'missed' ? 'Missed' : 'Pending'),
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: statusColor,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      if (status == 'pending')
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('${dose['medicineName']} marked as taken'),
                                        backgroundColor: Colors.green,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                    // TODO: Update dose status in state management
                                  },
                                  icon: const Icon(Icons.check_circle, size: 18),
                                  label: Text(
                                    'Mark Taken',
                                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('${dose['medicineName']} skipped'),
                                        backgroundColor: Colors.orange,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                    // TODO: Update dose status in state management
                                  },
                                  icon: const Icon(Icons.cancel, size: 18),
                                  label: Text(
                                    'Skip',
                                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.orange[700],
                                    side: BorderSide(color: Colors.orange[700]!),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ).animate(delay: (entry.key * 100).ms).fadeIn().slideX(begin: 0.2);
              }).toList(),
              const SizedBox(height: 12),
            ],
          );
        }
        
        // Subsequent items: Vitals sections
        final adjustedIndex = dateIndex - 1;
        final date = vitalsByDate.keys.elementAt(adjustedIndex);
        final vitals = vitalsByDate[date]!;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(
                date,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey[800],
                ),
              ),
            ),
            ...vitals.asMap().entries.map((entry) {
              final vital = entry.value;
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
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
                        gradient: vital['gradient'] as Gradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(vital['icon'] as String, style: const TextStyle(fontSize: 24)),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            vital['name'] as String,
                            style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                          ),
                          Text(
                            vital['time'] as String,
                            style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      vital['value'] as String,
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ).animate(delay: (entry.key * 100).ms).fadeIn().slideX(begin: 0.2);
            }).toList(),
          ],
        );
      },
    );
  }
}
