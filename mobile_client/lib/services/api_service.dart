import 'dart:convert';
import 'package:http/http.dart' as http;
import 'backend_config_service.dart';

class ApiService {
  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // Store JWT token for authenticated requests
  String? _jwtToken;

  // Getter for JWT token
  String? get jwtToken => _jwtToken;

  // Set JWT token
  void setJwtToken(String? token) {
    _jwtToken = token;
  }

  // Clear JWT token
  void clearJwtToken() {
    _jwtToken = null;
  }

  // Get headers for authenticated requests
  Map<String, String> _getHeaders({bool requiresAuth = false}) {
    Map<String, String> headers = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth && _jwtToken != null) {
      headers['Authorization'] = 'Bearer $_jwtToken';
    }

    return headers;
  }

  // Handle HTTP responses
  Map<String, dynamic> _handleResponse(http.Response response) {
    final data = json.decode(response.body);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        'success': true,
        'data': data,
        'statusCode': response.statusCode,
      };
    } else {
      return {
        'success': false,
        'error': data['message'] ?? 'Unknown error occurred',
        'statusCode': response.statusCode,
        'data': data,
      };
    }
  }

  // Verify Google ID token with backend
  Future<Map<String, dynamic>> verifyGoogleToken(String idToken) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/google/verify');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(),
        body: json.encode({
          'token': idToken,
        }),
      );

      final result = _handleResponse(response);
      
      // If successful, store the JWT token
      if (result['success'] && result['data']['token'] != null) {
        _jwtToken = result['data']['token'];
        print('✅ Google Auth: JWT Token stored successfully');
        print('🔐 Token preview: ${_jwtToken!.substring(0, _jwtToken!.length > 20 ? 20 : _jwtToken!.length)}...');
      } else {
        print('❌ Google Auth: No token received in response');
      }

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Register a new user
  Future<Map<String, dynamic>> register({
    required String email,
    required String username,
    required String password,
  }) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/register');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(),
        body: json.encode({
          'email': email,
          'username': username,
          'password': password,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Login with email/username and password
  Future<Map<String, dynamic>> login({
    String? email,
    String? username,
    required String password,
  }) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/login');
      
      Map<String, String> loginData = {'password': password};
      if (email != null) {
        loginData['email'] = email;
      } else if (username != null) {
        loginData['username'] = username;
      } else {
        return {
          'success': false,
          'error': 'Either email or username is required',
          'statusCode': 400,
        };
      }

      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(),
        body: json.encode(loginData),
      );

      final result = _handleResponse(response);
      
      // If successful, store the JWT token
      if (result['success'] && result['data']['token'] != null) {
        _jwtToken = result['data']['token'];
        print('✅ Login: JWT Token stored successfully');
        print('🔐 Token preview: ${_jwtToken!.substring(0, _jwtToken!.length > 20 ? 20 : _jwtToken!.length)}...');
      } else {
        print('❌ Login: No token received in response');
      }

      return result;
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Get about.json with service information
  Future<Map<String, dynamic>> getAbout() async {
    try {
      final url = BackendConfigService.getApiUrl('/about.json');
      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Get user's areas
  Future<Map<String, dynamic>> getAreas() async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas');
      final response = await http.get(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Create a new area
  Future<Map<String, dynamic>> createArea({
    required String actionServiceName,
    required String actionName,
    required Map<String, dynamic> actionParameters,
    required String reactionServiceName,
    required String reactionName,
    required Map<String, dynamic> reactionParameters,
    String? name,
    String? description,
  }) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
        body: json.encode({
          'actionServiceName': actionServiceName,
          'actionName': actionName,
          'actionParameters': actionParameters,
          'reactionServiceName': reactionServiceName,
          'reactionName': reactionName,
          'reactionParameters': reactionParameters,
          if (name != null) 'name': name,
          if (description != null) 'description': description,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Toggle area enabled/disabled
  Future<Map<String, dynamic>> toggleArea(String areaId, bool enabled) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas/$areaId/toggle');
      final response = await http.put(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
        body: json.encode({
          'enabled': enabled,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Execute area manually
  Future<Map<String, dynamic>> executeArea(String areaId) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas/$areaId/execute');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Delete area
  Future<Map<String, dynamic>> deleteArea(String areaId) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas/$areaId');
      final response = await http.delete(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Test a reaction
  Future<Map<String, dynamic>> testReaction({
    required String serviceName,
    required String reactionName,
    required Map<String, dynamic> parameters,
  }) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/areas/test/reaction');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(requiresAuth: true),
        body: json.encode({
          'serviceName': serviceName,
          'reactionName': reactionName,
          'parameters': parameters,
        }),
      );

      return _handleResponse(response);
    } catch (e) {
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }

  // Get authenticated user information
  Future<Map<String, dynamic>> getUserInfo() async {
    try {
      print('🔐 getUserInfo: JWT Token available: ${_jwtToken != null}');
      if (_jwtToken != null) {
        print('🔐 Token preview: ${_jwtToken!.substring(0, _jwtToken!.length > 20 ? 20 : _jwtToken!.length)}...');
      }
      
      final url = BackendConfigService.getApiUrl('/api/users/info');
      final headers = _getHeaders(requiresAuth: true);
      
      print('🔐 Request URL: $url');
      print('🔐 Request Headers: ${headers.keys.join(", ")}');
      
      final response = await http.get(
        Uri.parse(url),
        headers: headers,
      );

      print('🔐 Response Status: ${response.statusCode}');
      print('🔐 Response Body: ${response.body}');

      return _handleResponse(response);
    } catch (e) {
      print('❌ getUserInfo Error: ${e.toString()}');
      return {
        'success': false,
        'error': 'Network error: ${e.toString()}',
        'statusCode': 0,
      };
    }
  }
}
