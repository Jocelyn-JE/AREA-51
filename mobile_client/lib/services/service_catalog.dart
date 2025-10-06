import 'package:flutter/material.dart';

class ServiceInfo {
  final String name;
  final IconData icon;
  final String description;
  final bool connected;

  const ServiceInfo({
    required this.name,
    required this.icon,
    required this.description,
    required this.connected,
  });
}

const kServicesCatalog = <ServiceInfo>[
  ServiceInfo(
    name: 'GitHub',
    icon: Icons.code,
    description: 'Version control and collaboration',
    connected: true,
  ),
  ServiceInfo(
    name: 'Discord',
    icon: Icons.chat,
    description: 'Communication platform',
    connected: false,
  ),
  ServiceInfo(
    name: 'Spotify',
    icon: Icons.music_note,
    description: 'Music streaming service',
    connected: true,
  ),
  ServiceInfo(
    name: 'Gmail',
    icon: Icons.email,
    description: 'Email service',
    connected: false,
  ),
  ServiceInfo(
    name: 'Twitter',
    icon: Icons.alternate_email,
    description: 'Social media platform',
    connected: false,
  ),
];
