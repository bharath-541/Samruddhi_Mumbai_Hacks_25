import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final String time;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.time,
  });
}

class SiaNotifier extends StateNotifier<List<ChatMessage>> {
  SiaNotifier() : super([]);

  void sendMessage(String text) {
    final now = TimeOfDay.now();
    final timeString = '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')}';

    // Add user message
    state = [
      ...state,
      ChatMessage(
        text: text,
        isUser: true,
        time: timeString,
      ),
    ];

    // Simulate AI response
    Future.delayed(const Duration(seconds: 1), () {
      state = [
        ...state,
        ChatMessage(
          text: _generateResponse(text),
          isUser: false,
          time: timeString,
        ),
      ];
    });
  }

  String _generateResponse(String userMessage) {
    final lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.contains('summarize') || lowerMessage.contains('summary')) {
      return 'I can help you summarize your health records! You have 3 medical records and 1 active consent. Your latest record was uploaded 2 days ago. Would you like me to provide more details about any specific record?';
    } else if (lowerMessage.contains('medication') || lowerMessage.contains('medicine')) {
      return 'I can help you track your medications. Based on your records, you should take your prescribed medications as directed. Would you like me to set up reminders for you?';
    } else if (lowerMessage.contains('trend') || lowerMessage.contains('analysis')) {
      return 'Your health trends look good! I noticed you\'ve been regularly updating your records. This consistency helps in better health monitoring. Keep up the great work! 📈';
    } else if (lowerMessage.contains('search') || lowerMessage.contains('find')) {
      return 'I can search through your medical records. What specific information are you looking for? You can search by date, doctor name, or type of record.';
    } else if (lowerMessage.contains('hello') || lowerMessage.contains('hi')) {
      return 'Hello! I\'m SIA, your health AI assistant. I can help you manage your medical records, provide health insights, and answer questions about your health data. How can I assist you today? 😊';
    } else if (lowerMessage.contains('help')) {
      return 'I can help you with:\n\n📊 Summarizing your health records\n💊 Medication tracking and reminders\n📈 Health trends analysis\n🔍 Searching your medical records\n✨ AI-powered health insights\n\nWhat would you like to know more about?';
    } else {
      return 'That\'s a great question! I\'m here to help you manage your health records and provide insights. Could you provide more details or ask about your records, medications, or health trends?';
    }
  }

  Map<String, String> generateSummary() {
    return {
      'overview': 'You have 3 medical records and 1 active consent in your health hub. Your account is in good standing with regular updates. All your records are securely stored and encrypted.',
      'recent': 'Last record uploaded: 2 days ago\nLast consent granted: 5 days ago\nTotal uploads this month: 2 records\nActive healthcare providers: 1',
      'insights': '✓ You\'re maintaining good health record hygiene!\n✓ Consider scheduling regular check-ups\n✓ All your consents are up to date\n✓ Your data is fully encrypted and secure',
    };
  }

  void exportSummary() {
    // Implement export functionality
    // This could export to PDF, CSV, etc.
  }

  void shareSummary() {
    // Implement share functionality
    // This could open share dialog
  }

  void clearChat() {
    state = [];
  }
}

final siaProvider = StateNotifierProvider<SiaNotifier, List<ChatMessage>>(
  (ref) => SiaNotifier(),
);
