import 'package:flutter/material.dart';
import 'api_service.dart';
import '../models/service_models.dart';

class ServiceInfo {
  final String name;
  final IconData icon;
  final String description;
  final bool connected;
  final List<ServiceAction> actions;
  final List<ServiceReaction> reactions;

  const ServiceInfo({
    required this.name,
    required this.icon,
    required this.description,
    required this.connected,
    required this.actions,
    required this.reactions,
  });

  factory ServiceInfo.fromService(Service service, {bool connected = false}) {
    return ServiceInfo(
      name: service.name,
      icon: _getIconForService(service.name),
      description: _getDescriptionForService(service.name),
      connected: connected,
      actions: service.actions,
      reactions: service.reactions,
    );
  }

  static IconData _getIconForService(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'github':
        return Icons.code;
      case 'discord':
        return Icons.chat;
      case 'spotify':
        return Icons.music_note;
      case 'gmail':
      case 'email':
        return Icons.email;
      case 'twitter':
      case 'x':
        return Icons.alternate_email;
      case 'google':
        return Icons.g_mobiledata;
      case 'youtube':
        return Icons.video_library;
      case 'facebook':
        return Icons.facebook;
      case 'instagram':
        return Icons.photo_camera;
      case 'linkedin':
        return Icons.business;
      case 'slack':
        return Icons.work;
      case 'twitch':
        return Icons.videogame_asset;
      case 'reddit':
        return Icons.forum;
      case 'dropbox':
        return Icons.cloud_upload;
      case 'onedrive':
        return Icons.cloud_done;
      case 'trello':
        return Icons.dashboard;
      case 'notion':
        return Icons.note;
      case 'weather':
        return Icons.wb_sunny;
      case 'calendar':
        return Icons.calendar_today;
      default:
        return Icons.integration_instructions;
    }
  }

  static String _getDescriptionForService(String serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'github':
        return 'Version control and collaboration';
      case 'discord':
        return 'Communication platform';
      case 'spotify':
        return 'Music streaming service';
      case 'gmail':
      case 'email':
        return 'Email service';
      case 'twitter':
      case 'x':
        return 'Social media platform';
      case 'google':
        return 'Google services integration';
      case 'youtube':
        return 'Video sharing platform';
      case 'facebook':
        return 'Social networking service';
      case 'instagram':
        return 'Photo and video sharing';
      case 'linkedin':
        return 'Professional networking';
      case 'slack':
        return 'Team communication';
      case 'twitch':
        return 'Live streaming platform';
      case 'reddit':
        return 'Social news aggregation';
      case 'dropbox':
        return 'Cloud file storage';
      case 'onedrive':
        return 'Microsoft cloud storage';
      case 'trello':
        return 'Project management tool';
      case 'notion':
        return 'All-in-one workspace';
      case 'weather':
        return 'Weather information service';
      case 'calendar':
        return 'Calendar and scheduling';
      default:
        return 'Service integration';
    }
  }
}

class ServiceCatalogManager {
  static final ApiService _apiService = ApiService();
  static List<ServiceInfo> _cachedServices = [];
  static DateTime? _lastFetch;
  static const Duration _cacheValidDuration = Duration(minutes: 5);

  // Getter for cached services
  static List<ServiceInfo> get cachedServices => List.from(_cachedServices);

  // Check if cache is still valid
  static bool get isCacheValid {
    return _lastFetch != null &&
        DateTime.now().difference(_lastFetch!) < _cacheValidDuration;
  }

  // Fetch services from backend API
  static Future<List<ServiceInfo>> fetchServices({bool forceRefresh = false}) async {
    // Return cached services if still valid and not forcing refresh
    if (!forceRefresh && isCacheValid && _cachedServices.isNotEmpty) {
      return _cachedServices;
    }

    try {
      final result = await _apiService.getAbout();
      
      if (result['success']) {
        final aboutResponse = AboutResponse.fromJson(result['data']);
        final services = aboutResponse.services;

        // Convert Service objects to ServiceInfo objects
        _cachedServices = services
            .map((service) => ServiceInfo.fromService(service))
            .toList();
        
        _lastFetch = DateTime.now();
        
        print('✅ Fetched ${_cachedServices.length} services from backend');
        return _cachedServices;
      } else {
        print('❌ Failed to fetch services: ${result['error']}');
        // Return fallback services if API fails
        return _getFallbackServices();
      }
    } catch (e) {
      print('💥 Error fetching services: $e');
      // Return fallback services if there's an exception
      return _getFallbackServices();
    }
  }

  // Clear cached services
  static void clearCache() {
    _cachedServices.clear();
    _lastFetch = null;
  }

  // No fallback services - if backend is unavailable, show empty list
  static List<ServiceInfo> _getFallbackServices() {
    print('⚠️ Backend unavailable: Returning empty service list');
    _cachedServices = [];
    _lastFetch = DateTime.now();
    return _cachedServices;
  }
}

// Get services from backend only (no hardcoded fallback)
Future<List<ServiceInfo>> getServicesCatalog({bool forceRefresh = false}) async {
  return await ServiceCatalogManager.fetchServices(forceRefresh: forceRefresh);
}
