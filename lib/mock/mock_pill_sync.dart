import 'dart:math';

/// Pill Sync - Smart medication adherence tracking
class MedicationSchedule {
  final String id;
  final String medicineName;
  final String dosage;
  final String frequency; // e.g., "1-1-1", "1-0-1", "0-0-1"
  final int durationDays;
  final DateTime startDate;
  final DateTime endDate;
  final String? instructions;
  final List<DoseTime> doseTimes;
  final String prescriptionId;

  MedicationSchedule({
    required this.id,
    required this.medicineName,
    required this.dosage,
    required this.frequency,
    required this.durationDays,
    required this.startDate,
    required this.endDate,
    this.instructions,
    required this.doseTimes,
    required this.prescriptionId,
  });
}

class DoseTime {
  final String timeSlot; // 'morning', 'afternoon', 'evening', 'night'
  final String time; // '08:00', '13:00', '20:00'
  final bool enabled;

  DoseTime({
    required this.timeSlot,
    required this.time,
    required this.enabled,
  });
}

class DoseLog {
  final String id;
  final String medicationScheduleId;
  final DateTime scheduledTime;
  final DateTime? takenTime;
  final String status; // 'taken', 'missed', 'skipped', 'pending'
  final String? notes;

  DoseLog({
    required this.id,
    required this.medicationScheduleId,
    required this.scheduledTime,
    this.takenTime,
    required this.status,
    this.notes,
  });
}

class AdherenceStats {
  final int totalDoses;
  final int takenDoses;
  final int missedDoses;
  final int skippedDoses;
  final double adherencePercentage;
  final List<String> mostMissedTimes;
  final Map<String, int> weeklyTrend;

  AdherenceStats({
    required this.totalDoses,
    required this.takenDoses,
    required this.missedDoses,
    required this.skippedDoses,
    required this.adherencePercentage,
    required this.mostMissedTimes,
    required this.weeklyTrend,
  });
}

class MockPillSyncData {
  static final Random _random = Random();

  /// Get active medication schedules
  static List<MedicationSchedule> getActiveMedications() {
    final now = DateTime.now();
    
    return [
      MedicationSchedule(
        id: 'med_1',
        medicineName: 'Metformin',
        dosage: '500mg',
        frequency: '1-0-1',
        durationDays: 60,
        startDate: now.subtract(Duration(days: 10)),
        endDate: now.add(Duration(days: 50)),
        instructions: 'Take with meals',
        doseTimes: [
          DoseTime(timeSlot: 'morning', time: '08:00', enabled: true),
          DoseTime(timeSlot: 'afternoon', time: '13:00', enabled: false),
          DoseTime(timeSlot: 'evening', time: '20:00', enabled: true),
          DoseTime(timeSlot: 'night', time: '22:00', enabled: false),
        ],
        prescriptionId: '3',
      ),
      MedicationSchedule(
        id: 'med_2',
        medicineName: 'Amlodipine',
        dosage: '5mg',
        frequency: '1-0-0',
        durationDays: 30,
        startDate: now.subtract(Duration(days: 5)),
        endDate: now.add(Duration(days: 25)),
        instructions: 'Take in the morning',
        doseTimes: [
          DoseTime(timeSlot: 'morning', time: '08:00', enabled: true),
          DoseTime(timeSlot: 'afternoon', time: '13:00', enabled: false),
          DoseTime(timeSlot: 'evening', time: '20:00', enabled: false),
          DoseTime(timeSlot: 'night', time: '22:00', enabled: false),
        ],
        prescriptionId: '2',
      ),
      MedicationSchedule(
        id: 'med_3',
        medicineName: 'Paracetamol',
        dosage: '500mg',
        frequency: '1-1-1',
        durationDays: 5,
        startDate: now.subtract(Duration(days: 2)),
        endDate: now.add(Duration(days: 3)),
        instructions: 'Take after food',
        doseTimes: [
          DoseTime(timeSlot: 'morning', time: '09:00', enabled: true),
          DoseTime(timeSlot: 'afternoon', time: '14:00', enabled: true),
          DoseTime(timeSlot: 'evening', time: '21:00', enabled: true),
          DoseTime(timeSlot: 'night', time: '22:00', enabled: false),
        ],
        prescriptionId: '1',
      ),
      MedicationSchedule(
        id: 'med_4',
        medicineName: 'Vitamin D3',
        dosage: '60000 IU',
        frequency: '0-0-0-1',
        durationDays: 7,
        startDate: now.subtract(Duration(days: 3)),
        endDate: now.add(Duration(days: 4)),
        instructions: 'Take once weekly',
        doseTimes: [
          DoseTime(timeSlot: 'morning', time: '08:00', enabled: false),
          DoseTime(timeSlot: 'afternoon', time: '13:00', enabled: false),
          DoseTime(timeSlot: 'evening', time: '20:00', enabled: false),
          DoseTime(timeSlot: 'night', time: '22:00', enabled: true),
        ],
        prescriptionId: '1',
      ),
    ];
  }

  /// Get today's dose schedule
  static List<Map<String, dynamic>> getTodaysDoses() {
    final medications = getActiveMedications();
    List<Map<String, dynamic>> todayDoses = [];
    
    for (var med in medications) {
      for (var doseTime in med.doseTimes) {
        if (doseTime.enabled) {
          final scheduledTime = DateTime.now().copyWith(
            hour: int.parse(doseTime.time.split(':')[0]),
            minute: int.parse(doseTime.time.split(':')[1]),
          );
          
          todayDoses.add({
            'medicationScheduleId': med.id,
            'medicineName': med.medicineName,
            'dosage': med.dosage,
            'timeSlot': doseTime.timeSlot,
            'scheduledTime': scheduledTime,
            'status': _generateDoseStatus(scheduledTime),
            'instructions': med.instructions,
          });
        }
      }
    }
    
    todayDoses.sort((a, b) => 
      (a['scheduledTime'] as DateTime).compareTo(b['scheduledTime'] as DateTime)
    );
    
    return todayDoses;
  }

  /// Get dose logs for last 7 days
  static List<DoseLog> getRecentDoseLogs() {
    final now = DateTime.now();
    List<DoseLog> logs = [];
    final medications = getActiveMedications();
    
    for (int day = 7; day >= 0; day--) {
      for (var med in medications) {
        for (var doseTime in med.doseTimes) {
          if (doseTime.enabled) {
            final scheduledTime = now.subtract(Duration(days: day)).copyWith(
              hour: int.parse(doseTime.time.split(':')[0]),
              minute: int.parse(doseTime.time.split(':')[1]),
            );
            
            final status = _random.nextDouble() > 0.2 ? 'taken' : 'missed';
            final takenTime = status == 'taken' 
                ? scheduledTime.add(Duration(minutes: _random.nextInt(30)))
                : null;
            
            logs.add(DoseLog(
              id: 'log_${med.id}_${day}_${doseTime.timeSlot}',
              medicationScheduleId: med.id,
              scheduledTime: scheduledTime,
              takenTime: takenTime,
              status: status,
              notes: null,
            ));
          }
        }
      }
    }
    
    return logs;
  }

  /// Get adherence statistics
  static AdherenceStats getAdherenceStats() {
    final logs = getRecentDoseLogs();
    final takenDoses = logs.where((l) => l.status == 'taken').length;
    final missedDoses = logs.where((l) => l.status == 'missed').length;
    final skippedDoses = logs.where((l) => l.status == 'skipped').length;
    final totalDoses = logs.length;
    
    // Calculate most missed times
    final missedByTime = <String, int>{};
    for (var log in logs.where((l) => l.status == 'missed')) {
      final hour = log.scheduledTime.hour;
      String timeSlot;
      if (hour < 12) timeSlot = 'Morning';
      else if (hour < 17) timeSlot = 'Afternoon';
      else if (hour < 21) timeSlot = 'Evening';
      else timeSlot = 'Night';
      
      missedByTime[timeSlot] = (missedByTime[timeSlot] ?? 0) + 1;
    }
    
    final sortedEntries = missedByTime.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final mostMissedTimes = sortedEntries
        .take(2)
        .map((e) => e.key)
        .toList();
    
    // Weekly trend
    final weeklyTrend = <String, int>{};
    final daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    for (int i = 0; i < 7; i++) {
      final date = DateTime.now().subtract(Duration(days: 6 - i));
      final dayLogs = logs.where((l) => 
        l.scheduledTime.day == date.day && 
        l.scheduledTime.month == date.month
      );
      final taken = dayLogs.where((l) => l.status == 'taken').length;
      weeklyTrend[daysOfWeek[date.weekday - 1]] = taken;
    }
    
    return AdherenceStats(
      totalDoses: totalDoses,
      takenDoses: takenDoses,
      missedDoses: missedDoses,
      skippedDoses: skippedDoses,
      adherencePercentage: totalDoses > 0 ? (takenDoses / totalDoses * 100) : 0,
      mostMissedTimes: mostMissedTimes,
      weeklyTrend: weeklyTrend,
    );
  }

  /// Get upcoming doses (next 24 hours)
  static List<Map<String, dynamic>> getUpcomingDoses() {
    final medications = getActiveMedications();
    List<Map<String, dynamic>> upcoming = [];
    final now = DateTime.now();
    
    for (var med in medications) {
      for (var doseTime in med.doseTimes) {
        if (doseTime.enabled) {
          var scheduledTime = now.copyWith(
            hour: int.parse(doseTime.time.split(':')[0]),
            minute: int.parse(doseTime.time.split(':')[1]),
            second: 0,
          );
          
          // If time has passed today, schedule for tomorrow
          if (scheduledTime.isBefore(now)) {
            scheduledTime = scheduledTime.add(Duration(days: 1));
          }
          
          // Only include next 24 hours
          if (scheduledTime.difference(now).inHours <= 24) {
            upcoming.add({
              'medicationScheduleId': med.id,
              'medicineName': med.medicineName,
              'dosage': med.dosage,
              'timeSlot': doseTime.timeSlot,
              'scheduledTime': scheduledTime,
              'instructions': med.instructions,
            });
          }
        }
      }
    }
    
    upcoming.sort((a, b) => 
      (a['scheduledTime'] as DateTime).compareTo(b['scheduledTime'] as DateTime)
    );
    
    return upcoming;
  }

  /// Get medication insights
  static List<String> getMedicationInsights() {
    final stats = getAdherenceStats();
    final medications = getActiveMedications();
    final insights = <String>[];
    
    // Adherence insight
    if (stats.adherencePercentage >= 90) {
      insights.add('🎉 Excellent adherence! You\'re taking ${stats.adherencePercentage.toStringAsFixed(0)}% of your medicines on time.');
    } else if (stats.adherencePercentage >= 75) {
      insights.add('👍 Good adherence at ${stats.adherencePercentage.toStringAsFixed(0)}%. Try to maintain this consistency.');
    } else {
      insights.add('⚠️ Adherence is ${stats.adherencePercentage.toStringAsFixed(0)}%. Missing doses can affect your health.');
    }
    
    // Most missed times
    if (stats.mostMissedTimes.isNotEmpty) {
      insights.add('📊 You often miss doses in the ${stats.mostMissedTimes.first}. Consider setting extra reminders.');
    }
    
    // Course ending soon
    final endingSoon = medications.where((m) => 
      m.endDate.difference(DateTime.now()).inDays <= 3 &&
      m.endDate.difference(DateTime.now()).inDays >= 0
    );
    if (endingSoon.isNotEmpty) {
      insights.add('📅 ${endingSoon.first.medicineName} course ending in ${endingSoon.first.endDate.difference(DateTime.now()).inDays} days.');
    }
    
    // Improvement trend
    if (stats.adherencePercentage > 80) {
      insights.add('📈 Your adherence has improved compared to last week. Keep it up!');
    }
    
    return insights;
  }

  static String _generateDoseStatus(DateTime scheduledTime) {
    final now = DateTime.now();
    final difference = scheduledTime.difference(now);
    
    if (difference.inMinutes > 30) {
      return 'pending';
    } else if (difference.inMinutes > -30 && difference.inMinutes <= 30) {
      return _random.nextDouble() > 0.3 ? 'taken' : 'pending';
    } else {
      return _random.nextDouble() > 0.2 ? 'taken' : 'missed';
    }
  }
}
