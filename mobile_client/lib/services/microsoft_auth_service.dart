import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'api_service.dart';

class MicrosoftAuthService {
  static String? _accessToken;
  static String? _jwtToken;
  static Map<String, dynamic>? _userData;

  // Getters
  static String? get accessToken => _accessToken;
  static String? get jwtToken => _jwtToken;
  static Map<String, dynamic>? get userData => _userData;
  static bool get isAuthenticated => _jwtToken != null;

  /// Authorize Microsoft services using WebView OAuth flow
  static Future<Map<String, dynamic>> authorizeMicrosoftServices(BuildContext context) async {
    try {
      debugPrint('[Microsoft] 🔄 Starting Microsoft Services Authorization...');

      // Get the authorization URL from backend
      final apiService = ApiService();
      
      // Check if user is authenticated
      if (apiService.jwtToken == null) {
        debugPrint('[Microsoft] ❌ User is not authenticated. JWT token is missing.');
        return {
          'success': false,
          'error': 'You must be logged in first to connect Microsoft services',
        };
      }
      
      debugPrint('[Microsoft] 🔑 JWT Token exists, requesting auth URL...');
      final authUrlResult = await apiService.getMicrosoftAuthUrl();

      debugPrint('[Microsoft] 📦 Auth URL Result: ${authUrlResult.toString()}');
      
      if (!authUrlResult['success']) {
        final errorMsg = authUrlResult['error'] ?? 'Failed to get authorization URL';
        debugPrint('[Microsoft] ❌ Failed to get auth URL: $errorMsg');
        return {
          'success': false,
          'error': errorMsg,
        };
      }

      final authUrl = authUrlResult['data']['authUrl'] as String?;
      if (authUrl == null || authUrl.isEmpty) {
        debugPrint('[Microsoft] ❌ No authorization URL received from backend');
        return {
          'success': false,
          'error': 'No authorization URL received',
        };
      }

      debugPrint('[Microsoft] 📍 Auth URL: $authUrl');

      // Show WebView for Microsoft OAuth
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MicrosoftAuthWebView(authUrl: authUrl),
        ),
      );

      if (result == null) {
        return {
          'success': false,
          'error': 'Authentication cancelled',
        };
      }

      if (result['success'] == true) {
        debugPrint('[Microsoft] ✅ Microsoft services authorization successful!');
        return result;
      } else {
        return {
          'success': false,
          'error': result['error'] ?? 'Authentication failed',
        };
      }
    } catch (error) {
      debugPrint('[Microsoft] 💥 Error authorizing Microsoft services: $error');
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

      debugPrint('[Microsoft] ✅ Successfully signed out from Microsoft');
    } catch (error) {
      debugPrint('[Microsoft] 💥 Error signing out: $error');
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

/// WebView widget for Microsoft OAuth flow (service authorization)
class MicrosoftAuthWebView extends StatefulWidget {
  final String authUrl;

  const MicrosoftAuthWebView({super.key, required this.authUrl});

  @override
  State<MicrosoftAuthWebView> createState() => _MicrosoftAuthWebViewState();
}

class _MicrosoftAuthWebViewState extends State<MicrosoftAuthWebView> {
  late final WebViewController _controller;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    debugPrint('[Microsoft] 🔧 Initializing WebView with URL: ${widget.authUrl}');
    
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFFFFFFFF))
      ..setNavigationDelegate(
        NavigationDelegate(
          onNavigationRequest: (NavigationRequest request) {
            debugPrint('[Microsoft] 🧭 Navigation request: ${request.url}');
            _checkForCallback(request.url);
            return NavigationDecision.navigate;
          },
          onPageStarted: (String url) {
            debugPrint('[Microsoft] 📄 Page started loading: $url');
            setState(() {
              _isLoading = true;
              _error = null;
            });
          },
          onPageFinished: (String url) {
            debugPrint('[Microsoft] ✅ Page finished loading: $url');
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('[Microsoft] 💥 WebView error: ${error.description}');
            debugPrint('[Microsoft] 💥 Error type: ${error.errorType}');
            debugPrint('[Microsoft] 💥 Error code: ${error.errorCode}');
            setState(() {
              _isLoading = false;
              _error = 'Failed to load: ${error.description}';
            });
          },
          onHttpError: (HttpResponseError error) {
            debugPrint('[Microsoft] 🚫 HTTP error: ${error.response?.statusCode}');
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
      debugPrint('[Microsoft] 🌐 Loading URL: $uri');
      _controller.loadRequest(uri);
    } catch (e) {
      debugPrint('[Microsoft] 💥 Failed to parse/load URL: $e');
      setState(() {
        _error = 'Invalid URL: $e';
        _isLoading = false;
      });
    }
  }

  void _checkForCallback(String url) async {
    // Check if this is the callback URL
    // The backend redirects to: {frontend_url}/dashboard?microsoft_auth=success or error
    if (url.contains('microsoft_auth=success')) {
      debugPrint('[Microsoft] ✅ Microsoft authentication successful callback received');
      
      setState(() {
        _isLoading = true;
      });

      // The backend has already stored the token server-side
      // We can close the WebView and return success
      if (mounted) {
        Navigator.of(context).pop({
          'success': true,
          'message': 'Microsoft services connected successfully',
        });
      }
    } else if (url.contains('microsoft_auth=error')) {
      debugPrint('[Microsoft] ❌ Microsoft authentication failed');
      if (mounted) {
        Navigator.of(context).pop({
          'success': false,
          'error': 'Microsoft authentication failed',
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Connect Microsoft Services'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            debugPrint('[Microsoft] 🚪 User closed WebView');
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
