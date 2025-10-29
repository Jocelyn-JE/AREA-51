import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'api_service.dart';

class GitHubAuthService {
  static String? _accessToken;
  static String? _jwtToken;
  static Map<String, dynamic>? _userData;

  // Getters
  static String? get accessToken => _accessToken;
  static String? get jwtToken => _jwtToken;
  static Map<String, dynamic>? get userData => _userData;
  static bool get isAuthenticated => _jwtToken != null;

  /// Sign in with GitHub using WebView OAuth flow
  static Future<Map<String, dynamic>> signInWithGitHub(BuildContext context) async {
    try {
      debugPrint('[GitHub] 🔄 Starting GitHub Sign-In...');

      // Get the authorization URL from backend
      final apiService = ApiService();
      
      // Check if user is authenticated
      if (apiService.jwtToken == null) {
        debugPrint('[GitHub] ❌ User is not authenticated. JWT token is missing.');
        return {
          'success': false,
          'error': 'You must be logged in first to connect GitHub',
        };
      }
      
      debugPrint('[GitHub] 🔑 JWT Token exists, requesting auth URL...');
      final authUrlResult = await apiService.getGithubAuthUrl();

      debugPrint('[GitHub] 📦 Auth URL Result: ${authUrlResult.toString()}');
      
      if (!authUrlResult['success']) {
        final errorMsg = authUrlResult['error'] ?? 'Failed to get authorization URL';
        debugPrint('[GitHub] ❌ Failed to get auth URL: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      }

      final authUrl = authUrlResult['data']['authUrl'] as String?;
      if (authUrl == null || authUrl.isEmpty) {
        debugPrint('[GitHub] ❌ No authorization URL received from backend');
        return {
          'success': false,
          'error': 'No authorization URL received',
        };
      }

      debugPrint('[GitHub] 📍 Auth URL: $authUrl');

      // Show WebView for GitHub OAuth
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => GitHubAuthWebView(authUrl: authUrl),
        ),
      );

      if (result == null) {
        return {
          'success': false,
          'error': 'Authentication cancelled',
        };
      }

      if (result['success'] == true) {
        _accessToken = result['accessToken'];
        _jwtToken = result['jwtToken'];
        _userData = result['userData'];

        // Set JWT token in API service
        apiService.setJwtToken(_jwtToken);

        debugPrint('[GitHub] ✅ GitHub authentication successful!');
        return result;
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Authentication failed',
        };
      }
    } catch (error) {
      debugPrint('[GitHub] 💥 Error signing in with GitHub: $error');
      return {
        'success': false,
        'error': error.toString(),
      };
    }
  }

  /// Sign out and clear all tokens
  static Future<void> signOut() async {
    try {
      _accessToken = null;
      _jwtToken = null;
      _userData = null;

      // Clear JWT token from API service
      final apiService = ApiService();
      apiService.clearJwtToken();

      debugPrint('[GitHub] ✅ Successfully signed out from GitHub');
    } catch (error) {
      debugPrint('[GitHub] 💥 Error signing out: $error');
    }
  }

  /// Get token information
  static Map<String, dynamic> getTokenInfo() {
    return {
      'accessToken': _accessToken,
      'jwtToken': _jwtToken,
      'userData': _userData,
    };
  }
}

/// WebView widget for GitHub OAuth flow
class GitHubAuthWebView extends StatefulWidget {
  final String authUrl;

  const GitHubAuthWebView({super.key, required this.authUrl});

  @override
  State<GitHubAuthWebView> createState() => _GitHubAuthWebViewState();
}

class _GitHubAuthWebViewState extends State<GitHubAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    debugPrint('[GitHub] 🔧 Initializing WebView with URL: ${widget.authUrl}');
    
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            debugPrint('[GitHub] 🧭 Navigation request: ${request.url}');
            _checkForCallback(request.url);
            return NavigationDecision.navigate;
          },
          onPageStarted: (String url) {
            debugPrint('[GitHub] 📄 Page started loading: $url');
            setState(() {
              _isLoading = true;
              _error = null;
            });
          },
          onPageFinished: (String url) {
            debugPrint('[GitHub] ✅ Page finished loading: $url');
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[GitHub] 💥 WebView error: ${error.description}');
            debugPrint('[GitHub] 💥 Error type: ${error.errorType}');
            debugPrint('[GitHub] 💥 Error code: ${error.errorCode}');
            setState(() {
              _isLoading = false;
              _error = 'Failed to load: ${error.description}';
            });
          },
          onHttpError: (HttpResponseError error) {
            debugPrint('[GitHub] 🚫 HTTP error: ${error.response?.statusCode}');
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
      debugPrint('[GitHub] 🌐 Loading URL: $uri');
      _controller.loadRequest(uri);
    } catch (e) {
      debugPrint('[GitHub] 💥 Failed to parse/load URL: $e');
      setState(() {
        _error = 'Invalid URL: $e';
        _isLoading = false;
      });
    }
  }

  void _checkForCallback(String url) async {
    // Check if this is the callback URL
    // The backend redirects to: {frontend_url}/dashboard?github_auth=success or error
    if (url.contains('github_auth=success')) {
      debugPrint('[GitHub] ✅ GitHub authentication successful callback received');
      
      setState(() {
        _isLoading = true;
      });

      // The backend has already stored the token server-side
      // We need to verify and get the JWT token
      try {
        // Since we're logged in, we should already have a JWT token from the initial login
        // The callback is just confirming the GitHub service authorization
        // We can close the WebView and return success
        if (mounted) {
          Navigator.of(context).pop({
            'success': true,
            'message': 'GitHub account connected successfully',
          });
        }
      } catch (e) {
        debugPrint('[GitHub] 💥 Error processing callback: $e');
        if (mounted) {
          Navigator.of(context).pop({
            'success': false,
            'error': 'Failed to process callback: ${e.toString()}',
          });
        }
      }
    } else if (url.contains('github_auth=error')) {
      debugPrint('[GitHub] ❌ GitHub authentication failed');
      if (mounted) {
        Navigator.of(context).pop({
          'success': false,
          'error': 'GitHub authentication failed',
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sign in with GitHub'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            debugPrint('[GitHub] 🚪 User closed WebView');
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
