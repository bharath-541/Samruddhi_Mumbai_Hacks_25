import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'app_colors.dart';

class AppText {
  // Hero / large
  static TextStyle heroTitle = GoogleFonts.poppins(
    fontSize: 34,
    fontWeight: FontWeight.w700, // bold 700
    color: AppColors.textPrimary,
  );

  // Section headings
  static TextStyle headline = GoogleFonts.poppins(
    fontSize: 22,
    fontWeight: FontWeight.w700,
    color: AppColors.textPrimary,
  );

  static TextStyle title = GoogleFonts.poppins(
    fontSize: 18,
    fontWeight: FontWeight.w600, // semibold
    color: AppColors.textPrimary,
  );

  // Card titles and smaller titles
  static TextStyle cardTitle = GoogleFonts.poppins(
    fontSize: 14,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  // Body text
  static TextStyle body = GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w500, // medium
    color: AppColors.textPrimary,
  );

  // Secondary / muted
  static TextStyle secondary = GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  // Captions
  static TextStyle caption = GoogleFonts.inter(
    fontSize: 12,
    color: AppColors.textMuted,
  );
}
