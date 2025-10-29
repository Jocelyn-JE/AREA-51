import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BackendConfigService {
  static const String _backendUrlKey = 'backend_url';
  static const String _defaultBackendUrl = 'http://10.0.2.2:8080';

  static String _currentBackendUrl = _defaultBackendUrl;

  /// Get the current backend URL
  static String get backendUrl => _currentBackendUrl;

  /// Initialize the service and load saved backend URL
  static Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _currentBackendUrl = prefs.getString(_backendUrlKey) ?? _defaultBackendUrl;
  }

  /// Save a new backend URL
  static Future<bool> setBackendUrl(String url) async {
    try {
      // Validate URL format
      if (!_isValidUrl(url)) {
        return false;
      }

      final prefs = await SharedPreferences.getInstance();
      bool success = await prefs.setString(_backendUrlKey, url);
      
      if (success) {
        _currentBackendUrl = url;
      }
      
      return success;
    } catch (e) {
      debugPrint('[BackendConfig] 💥 Error saving backend URL: $e');
      return false;
    }
  }

  /// Reset to default backend URL
  static Future<bool> resetToDefault() async {
    return await setBackendUrl(_defaultBackendUrl);
  }

  /// Get the complete API URL with endpoint
  static String getApiUrl(String endpoint) {
    String baseUrl = _currentBackendUrl;
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.substring(0, baseUrl.length - 1);
    }
    if (!endpoint.startsWith('/')) {
      endpoint = '/$endpoint';
    }
    return '$baseUrl$endpoint';
  }

  /// Validate URL format
  static bool _isValidUrl(String url) {
    try {
      Uri.parse(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch (e) {
      return false;
    }
  }

  /// Get a list of common backend URLs for development
  static List<String> getCommonUrls() {
    return [
      'http://10.0.2.2:8080',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://10.84.107.152:8080',
      'https://api.area51.com',
    ];
  }
}
