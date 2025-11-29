import 'package:go_router/go_router.dart';
import '../screens/splash/splash_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/auth/auth_screen.dart';
import '../screens/auth/signin_screen.dart';
import '../screens/auth/signup_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/records/records_screen.dart';
import '../screens/records/record_detail_screen.dart';
import '../screens/consent/consent_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/timeline/timeline_screen.dart';
import '../screens/devices/devices_screen.dart';
import '../screens/sia_assistant/sia_assistant_screen.dart';
import '../screens/ehr/add_prescription_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/auth',
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/signin',
      builder: (context, state) => const SignInScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: '/dashboard',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/records',
      builder: (context, state) => const RecordsScreen(),
    ),
    GoRoute(
      path: '/records/:id',
      builder: (context, state) => RecordDetailScreen(
        recordId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/consent',
      builder: (context, state) => const ConsentScreen(),
    ),
    GoRoute(
      path: '/profile',
      builder: (context, state) => const ProfileScreen(),
    ),
    GoRoute(
      path: '/timeline',
      builder: (context, state) => const TimelineScreen(),
    ),
    GoRoute(
      path: '/devices',
      builder: (context, state) => const DevicesScreen(),
    ),
    GoRoute(
      path: '/sia-assistant',
      builder: (context, state) => const SiaAssistantScreen(),
    ),
    GoRoute(
      path: '/add-prescription',
      builder: (context, state) => const AddPrescriptionScreen(),
    ),
  ],
);
