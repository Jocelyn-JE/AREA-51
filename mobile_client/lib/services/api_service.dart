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

  // ============================================================================
  // SYSTEM INFORMATION ENDPOINTS
  // ============================================================================

  /// GET /about.json
  /// Get project metadata including client info, server data, and available services
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

  // ============================================================================
  // USER RELATED ENDPOINTS
  // ============================================================================

  /// POST /api/register
  /// Register a new user with email, username, and password
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

  /// POST /api/login
  /// Login with email/username and password. Returns JWT token valid for 1 hour
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

  /// GET /api/users/info
  /// Get authenticated user information
  Future<Map<String, dynamic>> getUserInfo() async {
    try {
      final url = BackendConfigService.getApiUrl('/api/users/info');
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

  // ============================================================================
  // GOOGLE OAUTH ENDPOINTS
  // ============================================================================

  /// POST /api/auth/google/verify
  /// Verify Google token and authenticate user
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

  /// GET /api/auth/google/authorize
  /// Get Google OAuth authorization URL
  Future<Map<String, dynamic>> getGoogleAuthUrl() async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/google/authorize');
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

  // ============================================================================
  // GITHUB OAUTH ENDPOINTS
  // ============================================================================

  /// POST /api/auth/github/verify
  /// Verify GitHub token and authenticate user
  Future<Map<String, dynamic>> verifyGithubToken(String accessToken) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/github/verify');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(),
        body: json.encode({
          'token': accessToken,
        }),
      );

      final result = _handleResponse(response);
      
      // If successful, store the JWT token
      if (result['success'] && result['data']['token'] != null) {
        _jwtToken = result['data']['token'];
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

  /// GET /api/auth/github/authorize
  /// Get GitHub OAuth authorization URL
  Future<Map<String, dynamic>> getGithubAuthUrl() async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/github/authorize');
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

  // ============================================================================
  // MICROSOFT OAUTH ENDPOINTS
  // ============================================================================

  /// POST /api/auth/microsoft/verify
  /// Verify Microsoft token and authenticate user
  Future<Map<String, dynamic>> verifyMicrosoftToken(String accessToken) async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/microsoft/verify');
      final response = await http.post(
        Uri.parse(url),
        headers: _getHeaders(),
        body: json.encode({
          'token': accessToken,
        }),
      );

      final result = _handleResponse(response);
      
      // If successful, store the JWT token
      if (result['success'] && result['data']['token'] != null) {
        _jwtToken = result['data']['token'];
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

  /// GET /api/auth/microsoft/authorize
  /// Get Microsoft OAuth authorization URL
  Future<Map<String, dynamic>> getMicrosoftAuthUrl() async {
    try {
      final url = BackendConfigService.getApiUrl('/api/auth/microsoft/authorize');
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

  // ============================================================================
  // AREA MANAGEMENT ENDPOINTS
  // ============================================================================

  /// POST /api/areas
  /// Create a new AREA automation
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

  /// GET /api/areas
  /// Get all areas created by the authenticated user
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

  /// PUT /api/areas/{id}/toggle
  /// Enable or disable an area
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

  /// POST /api/areas/{id}/execute
  /// Manually execute an area
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

  /// DELETE /api/areas/{id}
  /// Delete a specific area
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

  // ============================================================================
  // TESTING & DEVELOPMENT ENDPOINTS
  // ============================================================================

  /// POST /api/areas/test/reaction
  /// Test a reaction with given parameters
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
}
