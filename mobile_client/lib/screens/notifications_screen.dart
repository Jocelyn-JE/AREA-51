import 'package:flutter/material.dart';
import '../widgets/app_bottom_nav.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<Map<String, dynamic>> notifications = [
    {
      'title': 'Area Triggered',
      'message': 'Your "GitHub to Discord" automation was triggered',
      'time': '2 minutes ago',
      'type': 'success',
      'read': false,
    },
    {
      'title': 'Service Connected',
      'message': 'Spotify has been successfully connected to your account',
      'time': '1 hour ago',
      'type': 'info',
      'read': true,
    },
    {
      'title': 'Area Failed',
      'message': 'Your "Email to Spotify" automation failed to execute',
      'time': '3 hours ago',
      'type': 'error',
      'read': false,
    },
    {
      'title': 'Welcome!',
      'message': 'Welcome to AREA-51! Start by creating your first automation.',
      'time': '1 day ago',
      'type': 'info',
      'read': true,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final unreadCount = notifications.where((n) => !n['read']).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: () {
                setState(() {
                  for (var notification in notifications) {
                    notification['read'] = true;
                  }
                });
              },
              child: const Text('Mark all read'),
            ),
          PopupMenuButton(
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: 'settings',
                child: Text('Notification Settings'),
              ),
              PopupMenuItem(
                value: 'clear',
                child: Text('Clear All'),
              ),
            ],
            onSelected: (value) {
              if (value == 'settings') {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Settings coming soon')),
                );
              } else if (value == 'clear') {
                setState(() {
                  notifications.clear();
                });
              }
            },
          ),
        ],
      ),
      body: notifications.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_off,
                    size: 80,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No notifications',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'You\'re all caught up!',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            )
          : Column(
              children: [
                if (unreadCount > 0)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    color: Colors.blue.shade50,
                    child: Text(
                      '$unreadCount unread notifications',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                  ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: notifications.length,
                    itemBuilder: (context, index) {
                      final notification = notifications[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        color: notification['read'] 
                            ? null 
                            : Colors.blue.shade50,
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _getTypeColor(notification['type'] as String),
                            child: Icon(
                              _getTypeIcon(notification['type'] as String),
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            notification['title'] as String,
                            style: TextStyle(
                              fontWeight: notification['read'] as bool 
                                  ? FontWeight.normal 
                                  : FontWeight.bold,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(notification['message'] as String),
                              const SizedBox(height: 4),
                              Text(
                                notification['time'] as String,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
                          ),
                          trailing: notification['read'] as bool
                              ? null
                              : const Icon(
                                  Icons.circle,
                                  color: Colors.blue,
                                  size: 12,
                                ),
                          onTap: () {
                            setState(() {
                              notification['read'] = true;
                            });
                            
                            showDialog(
                              context: context,
                              builder: (context) => AlertDialog(
                                title: Text(notification['title'] as String),
                                content: Text(notification['message'] as String),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(context),
                                    child: const Text('Close'),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 3),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'success':
        return Colors.green;
      case 'error':
        return Colors.red;
      case 'warning':
        return Colors.orange;
      case 'info':
      default:
        return Colors.blue;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'success':
        return Icons.check_circle;
      case 'error':
        return Icons.error;
      case 'warning':
        return Icons.warning;
      case 'info':
      default:
        return Icons.info;
    }
  }
}
