import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  static GoogleSignInAccount? _currentUser;
  static String? _idToken;

  // Getter for current user
  static GoogleSignInAccount? get currentUser => _currentUser;

  // Getter for ID token
  static String? get idToken => _idToken;

  // Initialize Google Sign-In
  static void initialize() {
    _googleSignIn.initialize(
      serverClientId:
          "210212748639-u6rbif83ca1uqkijrpc3iak87ajahrpd.apps.googleusercontent.com",
    );
  }

  /// Sign in with Google
  static Future<GoogleSignInAccount?> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount googleUser = await _googleSignIn.authenticate();

      // Store idToken to pass to backend for login
      _idToken = googleUser.authentication.idToken;
      _currentUser = googleUser;

      print('Google Sign-In Success!');
      print('User: ${googleUser.displayName}');
      print('Email: ${googleUser.email}');
      print('ID: ${googleUser.id}');
      print('ID Token: $_idToken');

      return googleUser;
    } catch (error) {
      print('Error signing in with Google: $error');
      _currentUser = null;
      _idToken = null;
      return null;
    }
  }

  /// Sign out from Google
  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      _currentUser = null;
      _idToken = null;
      print('Successfully signed out from Google');
    } catch (error) {
      print('Error signing out: $error');
    }
  }

  /// Check if user is already signed in
  static Future<bool> isSignedIn() async {
    return _currentUser != null;
  }

  /// Get user profile information using the access token
  static Future<Map<String, String?>?> getUserProfile() async {
    try {
      if (_currentUser == null) {
        print('No user is currently signed in');
        return null;
      }
      return {
        'id': _currentUser!.id,
        'email': _currentUser!.email,
        'displayName': _currentUser!.displayName,
        'photoUrl': _currentUser!.photoUrl,
      };
    } catch (error) {
      print('Error getting user profile: $error');
      return null;
    }
  }

  /// Get token information and details
  static Future<Map<String, dynamic>> getTokenInfo() async {
    return {'idToken': _idToken, 'user': await getUserProfile()};
  }
}
