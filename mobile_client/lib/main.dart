import 'package:flutter/material.dart';
import 'screens/start_screen.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/dashboard_screen.dart';
import 'services/services_screen.dart';
import 'screens/new_area_screen.dart';
import 'screens/choose_action_screen.dart';
import 'screens/choose_reactions_screen.dart';
import 'screens/confirm_naming_screen.dart';
import 'screens/my_areas_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/token_display_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AREA App',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const StartScreen(),
        '/login': (context) => const LoginScreen(),
        '/register': (context) => const RegisterScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/services': (context) => const ServicesScreen(),
        '/new-area': (context) => const NewAreaScreen(),
        '/choose-action': (context) => const ChooseActionScreen(),
        '/choose-reactions': (context) => const ChooseReactionsScreen(),
        '/confirm-naming': (context) => const ConfirmNamingScreen(),
        '/my-areas': (context) => const MyAreasScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/token-display': (context) => const TokenDisplayScreen(),
      },
      debugShowCheckedModeBanner: false,
    );
  }
}
