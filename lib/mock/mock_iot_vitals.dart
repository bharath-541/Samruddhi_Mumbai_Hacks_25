import 'dart:math';
import 'mock_pill_sync.dart';

/// Mock IoT health vitals data including Pill Sync
class HealthVital {
  final String id;
  final String type; // 'heart_rate', 'blood_pressure', 'temperature', 'spo2', 'glucose', 'steps', 'sleep'
  final dynamic value;
  final String unit;
  final DateTime timestamp;
  final String status; // 'normal', 'warning', 'critical'

  HealthVital({
    required this.id,
    required this.type,
    required this.value,
    required this.unit,
    required this.timestamp,
    required this.status,
  });
}

class MockIoTVitals {
  static final Random _random = Random();

  /// Get current vital readings
  static Map<String, HealthVital> getCurrentVitals() {
    final now = DateTime.now();
    
    return {
      'heart_rate': HealthVital(
        id: 'hr_${now.millisecondsSinceEpoch}',
        type: 'heart_rate',
        value: 72 + _random.nextInt(20),
        unit: 'bpm',
        timestamp: now,
        status: 'normal',
      ),
      'blood_pressure': HealthVital(
        id: 'bp_${now.millisecondsSinceEpoch}',
        type: 'blood_pressure',
        value: {'systolic': 120 + _random.nextInt(20), 'diastolic': 80 + _random.nextInt(10)},
        unit: 'mmHg',
        timestamp: now,
        status: 'normal',
      ),
      'spo2': HealthVital(
        id: 'spo2_${now.millisecondsSinceEpoch}',
        type: 'spo2',
        value: 96 + _random.nextInt(4),
        unit: '%',
        timestamp: now,
        status: 'normal',
      ),
      'temperature': HealthVital(
        id: 'temp_${now.millisecondsSinceEpoch}',
        type: 'temperature',
        value: 36.5 + _random.nextDouble() * 0.8,
        unit: '°C',
        timestamp: now,
        status: 'normal',
      ),
      'glucose': HealthVital(
        id: 'glucose_${now.millisecondsSinceEpoch}',
        type: 'glucose',
        value: 90 + _random.nextInt(40),
        unit: 'mg/dL',
        timestamp: now,
        status: 'normal',
      ),
    };
  }

  /// Get daily step count
  static HealthVital getDailySteps() {
    return HealthVital(
      id: 'steps_${DateTime.now().millisecondsSinceEpoch}',
      type: 'steps',
      value: 5000 + _random.nextInt(5000),
      unit: 'steps',
      timestamp: DateTime.now(),
      status: 'normal',
    );
  }

  /// Get sleep data for last night
  static HealthVital getLastNightSleep() {
    return HealthVital(
      id: 'sleep_${DateTime.now().millisecondsSinceEpoch}',
      type: 'sleep',
      value: {
        'total_hours': 6.5 + _random.nextDouble() * 2,
        'deep_sleep': 1.5 + _random.nextDouble(),
        'light_sleep': 4.0 + _random.nextDouble() * 2,
        'rem_sleep': 1.0 + _random.nextDouble(),
      },
      unit: 'hours',
      timestamp: DateTime.now().subtract(Duration(hours: 8)),
      status: 'normal',
    );
  }

  /// Get historical heart rate data (last 24 hours)
  static List<HealthVital> getHeartRateHistory() {
    final now = DateTime.now();
    List<HealthVital> history = [];
    
    for (int i = 24; i >= 0; i--) {
      history.add(HealthVital(
        id: 'hr_hist_$i',
        type: 'heart_rate',
        value: 65 + _random.nextInt(25),
        unit: 'bpm',
        timestamp: now.subtract(Duration(hours: i)),
        status: 'normal',
      ));
    }
    
    return history;
  }

  /// Get historical blood pressure data (last 7 days)
  static List<HealthVital> getBloodPressureHistory() {
    final now = DateTime.now();
    List<HealthVital> history = [];
    
    for (int i = 7; i >= 0; i--) {
      final systolic = 115 + _random.nextInt(25);
      final diastolic = 75 + _random.nextInt(15);
      
      history.add(HealthVital(
        id: 'bp_hist_$i',
        type: 'blood_pressure',
        value: {'systolic': systolic, 'diastolic': diastolic},
        unit: 'mmHg',
        timestamp: now.subtract(Duration(days: i)),
        status: systolic > 140 || diastolic > 90 ? 'warning' : 'normal',
      ));
    }
    
    return history;
  }

  /// Get glucose readings (last 30 days)
  static List<HealthVital> getGlucoseHistory() {
    final now = DateTime.now();
    List<HealthVital> history = [];
    
    for (int i = 30; i >= 0; i--) {
      final glucose = 85 + _random.nextInt(50);
      
      history.add(HealthVital(
        id: 'glucose_hist_$i',
        type: 'glucose',
        value: glucose,
        unit: 'mg/dL',
        timestamp: now.subtract(Duration(days: i)),
        status: glucose > 140 ? 'warning' : (glucose < 70 ? 'critical' : 'normal'),
      ));
    }
    
    return history;
  }

  /// Get weekly step count
  static List<HealthVital> getWeeklySteps() {
    final now = DateTime.now();
    List<HealthVital> history = [];
    
    for (int i = 7; i >= 0; i--) {
      history.add(HealthVital(
        id: 'steps_hist_$i',
        type: 'steps',
        value: 4000 + _random.nextInt(8000),
        unit: 'steps',
        timestamp: now.subtract(Duration(days: i)),
        status: 'normal',
      ));
    }
    
    return history;
  }

  /// Get weekly sleep data
  static List<HealthVital> getWeeklySleep() {
    final now = DateTime.now();
    List<HealthVital> history = [];
    
    for (int i = 7; i >= 0; i--) {
      final totalHours = 6.0 + _random.nextDouble() * 3;
      
      history.add(HealthVital(
        id: 'sleep_hist_$i',
        type: 'sleep',
        value: {
          'total_hours': totalHours,
          'deep_sleep': totalHours * 0.2,
          'light_sleep': totalHours * 0.5,
          'rem_sleep': totalHours * 0.3,
        },
        unit: 'hours',
        timestamp: now.subtract(Duration(days: i)),
        status: totalHours < 6 ? 'warning' : 'normal',
      ));
    }
    
    return history;
  }

  // ============= PILL SYNC INTEGRATION =============

  /// Get Pill Sync data - medication adherence tracking
  static Map<String, dynamic> getPillSyncData() {
    return {
      'active_medications': MockPillSyncData.getActiveMedications(),
      'todays_doses': MockPillSyncData.getTodaysDoses(),
      'upcoming_doses': MockPillSyncData.getUpcomingDoses(),
      'adherence_stats': MockPillSyncData.getAdherenceStats(),
      'recent_logs': MockPillSyncData.getRecentDoseLogs(),
      'insights': MockPillSyncData.getMedicationInsights(),
    };
  }

  /// Get quick Pill Sync summary for dashboard
  static Map<String, dynamic> getPillSyncSummary() {
    final stats = MockPillSyncData.getAdherenceStats();
    final todayDoses = MockPillSyncData.getTodaysDoses();
    final takenToday = todayDoses.where((d) => d['status'] == 'taken').length;
    final totalToday = todayDoses.length;
    final upcomingDoses = MockPillSyncData.getUpcomingDoses();
    
    return {
      'adherence_percentage': stats.adherencePercentage,
      'doses_today': '$takenToday/$totalToday taken',
      'next_dose': upcomingDoses.isNotEmpty ? upcomingDoses.first : null,
      'status': stats.adherencePercentage >= 80 ? 'good' : 'needs_attention',
      'insights': MockPillSyncData.getMedicationInsights(),
    };
  }
}
