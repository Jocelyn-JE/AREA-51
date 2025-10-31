import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:webview_flutter/webview_flutter.dart';
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

      debugPrint('[GoogleAuth] 🔑 Google Sign-In Success!');
      debugPrint('[GoogleAuth] User: ${googleUser.displayName}');
      debugPrint('[GoogleAuth] Email: ${googleUser.email}');
      debugPrint('[GoogleAuth] ID: ${googleUser.id}');
      debugPrint('[GoogleAuth] ID Token: $_idToken');

      // Send ID token to backend for authentication
      if (_idToken != null) {
        final apiService = ApiService();
        final result = await apiService.verifyGoogleToken(_idToken!);

        if (result['success']) {
          _jwtToken = result['data']['token'];
          debugPrint('[GoogleAuth] ✅ Backend authentication successful!');
          debugPrint('[GoogleAuth] JWT Token received: $_jwtToken');
          
          return {
            'success': true,
            'user': googleUser,
            'jwtToken': _jwtToken,
            'message': result['data']['message'] ?? 'Login successful',
          };
        } else {
          debugPrint('[GoogleAuth] ⚠️ Backend authentication failed: ${result['error']}');
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
      debugPrint('[GoogleAuth] 💥 Error signing in with Google: $error');
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
      
      debugPrint('[GoogleAuth] ✅ Successfully signed out from Google and cleared all tokens');
    } catch (error) {
      debugPrint('[GoogleAuth] 💥 Error signing out: $error');
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
        debugPrint('[GoogleAuth] ⚠️ No user is currently signed in');
        return null;
      }
      return {
        'id': _currentUser!.id,
        'email': _currentUser!.email,
        'displayName': _currentUser!.displayName,
        'photoUrl': _currentUser!.photoUrl,
      };
    } catch (error) {
      debugPrint('[GoogleAuth] 💥 Error getting user profile: $error');
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

  /// Authorize Google services using WebView OAuth flow
  /// This is separate from the initial Google Sign-In for user authentication
  static Future<Map<String, dynamic>> authorizeGoogleServices(BuildContext context) async {
    try {
      debugPrint('[GoogleAuth] 🔄 Starting Google Services Authorization...');

      // Get the authorization URL from backend
      final apiService = ApiService();
      
      // Check if user is authenticated
      if (apiService.jwtToken == null) {
        debugPrint('[GoogleAuth] ❌ User is not authenticated. JWT token is missing.');
        return {
          'success': false,
          'error': 'You must be logged in first to connect Google services',
        };
      }
      
      debugPrint('[GoogleAuth] 🔑 JWT Token exists, requesting auth URL...');
      final authUrlResult = await apiService.getGoogleAuthUrl();

      debugPrint('[GoogleAuth] 📦 Auth URL Result: ${authUrlResult.toString()}');
      
      if (!authUrlResult['success']) {
        final errorMsg = authUrlResult['error'] ?? 'Failed to get authorization URL';
        debugPrint('[GoogleAuth] ❌ Failed to get auth URL: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      }

      final authUrl = authUrlResult['data']['authUrl'] as String?;
      if (authUrl == null || authUrl.isEmpty) {
        debugPrint('[GoogleAuth] ❌ No authorization URL received from backend');
        return {
          'success': false,
          'error': 'No authorization URL received',
        };
      }

      debugPrint('[GoogleAuth] 📍 Auth URL: $authUrl');

      // Show WebView for Google OAuth
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => GoogleAuthWebView(authUrl: authUrl),
        ),
      );

      if (result == null) {
        return {
          'success': false,
          'error': 'Authentication cancelled',
        };
      }

      if (result['success'] == true) {
        debugPrint('[GoogleAuth] ✅ Google services authorization successful!');
        return result;
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Authentication failed',
        };
      }
    } catch (error) {
      debugPrint('[GoogleAuth] 💥 Error authorizing Google services: $error');
      return {
        'success': false,
        'error': error.toString(),
      };
    }
  }
}

/// WebView widget for Google OAuth flow (service authorization)
class GoogleAuthWebView extends StatefulWidget {
  final String authUrl;

  const GoogleAuthWebView({super.key, required this.authUrl});

  @override
  State<GoogleAuthWebView> createState() => _GoogleAuthWebViewState();
}

class _GoogleAuthWebViewState extends State<GoogleAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    debugPrint('[GoogleAuth] 🔧 Initializing WebView with URL: ${widget.authUrl}');
    
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            debugPrint('[GoogleAuth] 🧭 Navigation request: ${request.url}');
            _checkForCallback(request.url);
            return NavigationDecision.navigate;
          },
          onPageStarted: (String url) {
            debugPrint('[GoogleAuth] 📄 Page started loading: $url');
            setState(() {
              _isLoading = true;
              _error = null;
            });
          },
          onPageFinished: (String url) {
            debugPrint('[GoogleAuth] ✅ Page finished loading: $url');
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[GoogleAuth] 💥 WebView error: ${error.description}');
            debugPrint('[GoogleAuth] 💥 Error type: ${error.errorType}');
            debugPrint('[GoogleAuth] 💥 Error code: ${error.errorCode}');
            setState(() {
              _isLoading = false;
              _error = 'Failed to load: ${error.description}';
            });
          },
          onHttpError: (HttpResponseError error) {
            debugPrint('[GoogleAuth] 🚫 HTTP error: ${error.response?.statusCode}');
            setState(() {
              _isLoading = false;
              _error = 'HTTP error: ${error.response?.statusCode}';
            });
          },
        ),
      );
      
    // Load the URL
    try {
      final uri = Uri.parse(widget.authUrl);
      debugPrint('[GoogleAuth] 🌐 Loading URL: $uri');
      _controller.loadRequest(uri);
    } catch (e) {
      debugPrint('[GoogleAuth] 💥 Failed to parse/load URL: $e');
      setState(() {
        _error = 'Invalid URL: $e';
        _isLoading = false;
      });
    }
  }

  void _checkForCallback(String url) async {
    // Check if this is the callback URL
    // The backend redirects to: {frontend_url}/dashboard?google_auth=success or error
    if (url.contains('google_auth=success')) {
      debugPrint('[GoogleAuth] ✅ Google authentication successful callback received');
      
      setState(() {
        _isLoading = true;
      });

      // The backend has already stored the token server-side
      // We can close the WebView and return success
      if (mounted) {
        Navigator.of(context).pop({
          'success': true,
          'message': 'Google services connected successfully',
        });
      }
    } else if (url.contains('google_auth=error')) {
      debugPrint('[GoogleAuth] ❌ Google authentication failed');
      if (mounted) {
        Navigator.of(context).pop({
          'success': false,
          'error': 'Google authentication failed',
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Google Services'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            debugPrint('[GoogleAuth] 🚪 User closed WebView');
            Navigator.of(context).pop();
          },
        ),
      ),
      body: Stack(
        children: [
          if (_error == null)
            WebViewWidget(controller: _controller),
          if (_isLoading && _error == null)
            const Center(
              child: CircularProgressIndicator(),
            ),
          if (_error != null)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading page',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      setState(() {
                        _error = null;
                        _isLoading = true;
                      });
                      _controller.loadRequest(Uri.parse(widget.authUrl));
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
