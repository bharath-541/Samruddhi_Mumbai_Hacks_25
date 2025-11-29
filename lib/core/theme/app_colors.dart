import 'package:flutter/material.dart';

class AppColors {
  // Brand / neutrals
  static const backgroundBase = Color(0xFFFAFBFC); // near white (gray-50)
  static const scaffoldBackground = Color(0xFFFFFFFF);
  static const cardBackground = Color(0xFFFFFFFF);
  static const border = Color(0xFFE5E7EB); // gray-200

  // Text
  static const textPrimary = Color(0xFF111827); // gray-900
  static const textSecondary = Color(0xFF4B5563); // gray-600
  static const textMuted = Color(0xFF6B7280); // gray-500

  // Buttons / accents
  static const uiDark = Color(0xFF111827); // used for primary buttons (bg-gray-900)

  // Pastel accent palettes (light background + strong icon color)
  static const patientLight = Color(0xFFEFF6FF); // blue-50
  static const patientLight2 = Color(0xFFDBEAFE); // blue-100
  static const patient = Color(0xFF2563EB); // blue-600

  static const doctorLight = Color(0xFFF0FDF4); // green-50
  static const doctorLight2 = Color(0xFFD1FAE5); // green-100
  static const doctor = Color(0xFF16A34A); // green-600

  static const hospitalLight = Color(0xFFF5F3FF); // purple-50
  static const hospitalLight2 = Color(0xFFEDE9FE); // purple-100
  static const hospital = Color(0xFF7C3AED); // purple-600

  static const mobileLight = Color(0xFFFFF7ED); // orange-50
  static const mobileLight2 = Color(0xFFFFEDD5); // orange-100
  static const mobile = Color(0xFFEA580C); // orange-600

  static const aiLight = Color(0xFFF0FDFA); // teal-50
  static const aiLight2 = Color(0xFFF0F9FF); // light blue-ish
  static const ai = Color(0xFF0EA5A4); // teal-600-ish

  // Status
  static const success = Color(0xFF10B981); // green-600
  static const error = Color(0xFFDC2626); // red-600

  // Brand gradient (teal -> purple)
  static const brandGradientStart = Color(0xFF0EA5A4); // teal-500
  static const brandGradientEnd = Color(0xFF6D28D9); // purple-600

  static LinearGradient get brandGradient => const LinearGradient(
        colors: [brandGradientStart, brandGradientEnd],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  // Legacy gradients (kept for backward compatibility with UI widgets)
  static const gradientPurple = LinearGradient(
    colors: [Color(0xFF6C5CE7), Color(0xFFA29BFE)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const gradientGreen = LinearGradient(
    colors: [Color(0xFF00B894), Color(0xFF55EFC4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const gradientPink = LinearGradient(
    colors: [Color(0xFFFD79A8), Color(0xFFFF7675)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Backwards-compatible aliases (preserve existing usages)
  static const primary = patient;
  static const secondary = doctor;
  static const accent = mobile;
  static const background = backgroundBase;
  static const cardBg = cardBackground;
}
