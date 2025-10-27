import 'package:google_sign_in/google_sign_in.dart';
import 'api_service.dart';

class GoogleAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  static GoogleSignInAccount? _currentUser;
  static String? _idToken;
  static String? _jwtToken;

  // Getter for current user
  static GoogleSignInAccount? get currentUser => _currentUser;

  // Getter for ID token
  static String? get idToken => _idToken;

  // Getter for JW@Jocelyn-JE this is your line any clue T token
  static String? get jwtToken => _jwtToken;

  // Initialize Google Sign-In
  static void initialize() {
    _googleSignIn.initialize(
      serverClientId:
          "210212748639-u6rbif83ca1uqkijrpc3iak87ajahrpd.apps.googleusercontent.com",
    );
  }

  /// Sign in with Google and authenticate with backend
  static Future<Map<String, dynamic>> signInWithGoogle() async {
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

      // Send ID token to backend for authentication
      if (_idToken != null) {
        final apiService = ApiService();
        final result = await apiService.verifyGoogleToken(_idToken!);

        if (result['success']) {
          _jwtToken = result['data']['token'];
          print('Backend authentication successful!');
          print('JWT Token received: $_jwtToken');
          
          return {
            'success': true,
            'user': googleUser,
            'jwtToken': _jwtToken,
            'message': result['data']['message'] ?? 'Login successful',
          };
        } else {
          print('Backend authentication failed: ${result['error']}');
          // Don't sign out from Google, but return error
          return {
            'success': false,
            'user': googleUser,
            'error': result['error'],
            'statusCode': result['statusCode'],
          };
        }
      }

      return {
        'success': false,
        'user': googleUser,
        'error': 'No ID token received from Google',
      };
    } catch (error) {
      print('Error signing in with Google: $error');
      _currentUser = null;
      _idToken = null;
      _jwtToken = null;
      return {
        'success': false,
        'error': error.toString(),
      };
    }
  }

  /// Sign out from Google and clear all tokens
  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      _currentUser = null;
      _idToken = null;
      _jwtToken = null;
      
      // Clear JWT token from API service
      final apiService = ApiService();
      apiService.clearJwtToken();
      
      print('Successfully signed out from Google and cleared all tokens');
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
    return {
      'idToken': _idToken,
      'jwtToken': _jwtToken,
      'user': await getUserProfile(),
    };
  }

  /// Check if user is authenticated (has both Google account and JWT token)
  static bool get isFullyAuthenticated => _currentUser != null && _jwtToken != null;
}
