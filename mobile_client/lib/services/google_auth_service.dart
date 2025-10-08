import 'package:google_sign_in/google_sign_in.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class GoogleAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'openid',
      // Add additional scopes as needed
      // 'https://www.googleapis.com/auth/drive.readonly',
    ],
  );

  static GoogleSignInAccount? _currentUser;
  static String? _accessToken;
  static String? _idToken;

  // Getter for current user
  static GoogleSignInAccount? get currentUser => _currentUser;
  
  // Getter for access token
  static String? get accessToken => _accessToken;
  
  // Getter for ID token
  static String? get idToken => _idToken;

  /// Sign in with Google
  static Future<GoogleSignInAccount?> signInWithGoogle() async {
    try {
      // Trigger the authentication flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      
      if (googleUser == null) {
        // User canceled the sign-in
        return null;
      }

      // Obtain the auth details from the request
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      // Store tokens
      _accessToken = googleAuth.accessToken;
      _idToken = googleAuth.idToken;
      _currentUser = googleUser;

      print('Google Sign-In Success!');
      print('User: ${googleUser.displayName}');
      print('Email: ${googleUser.email}');
      print('ID: ${googleUser.id}');
      print('Access Token: ${_accessToken}');
      print('ID Token: ${_idToken}');

      return googleUser;
    } catch (error) {
      print('Error signing in with Google: $error');
      return null;
    }
  }

  /// Sign out from Google
  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      _currentUser = null;
      _accessToken = null;
      _idToken = null;
      print('Successfully signed out from Google');
    } catch (error) {
      print('Error signing out: $error');
    }
  }

  /// Check if user is already signed in
  static Future<bool> isSignedIn() async {
    final isSignedIn = await _googleSignIn.isSignedIn();
    if (isSignedIn) {
      _currentUser = _googleSignIn.currentUser;
      if (_currentUser != null) {
        final GoogleSignInAuthentication googleAuth = await _currentUser!.authentication;
        _accessToken = googleAuth.accessToken;
        _idToken = googleAuth.idToken;
      }
    }
    return isSignedIn;
  }

  /// Get user profile information using the access token
  static Future<Map<String, dynamic>?> getUserProfile() async {
    if (_accessToken == null) {
      print('No access token available');
      return null;
    }

    try {
      final response = await http.get(
        Uri.parse('https://www.googleapis.com/oauth2/v2/userinfo'),
        headers: {
          'Authorization': 'Bearer $_accessToken',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final profileData = json.decode(response.body);
        print('User Profile: $profileData');
        return profileData;
      } else {
        print('Failed to get user profile: ${response.statusCode}');
        return null;
      }
    } catch (error) {
      print('Error getting user profile: $error');
      return null;
    }
  }

  /// Refresh the access token
  static Future<String?> refreshToken() async {
    try {
      if (_currentUser != null) {
        final GoogleSignInAuthentication googleAuth = await _currentUser!.authentication;
        _accessToken = googleAuth.accessToken;
        _idToken = googleAuth.idToken;
        return _accessToken;
      }
      return null;
    } catch (error) {
      print('Error refreshing token: $error');
      return null;
    }
  }

  /// Get token information and details
  static Map<String, dynamic> getTokenInfo() {
    return {
      'accessToken': _accessToken,
      'idToken': _idToken,
      'user': _currentUser != null ? {
        'id': _currentUser!.id,
        'email': _currentUser!.email,
        'displayName': _currentUser!.displayName,
        'photoUrl': _currentUser!.photoUrl,
      } : null,
    };
  }
}
