import 'package:flutter/material.dart';
import '../services/service_catalog.dart';

class ChooseActionScreen extends StatefulWidget {
  const ChooseActionScreen({super.key});

  @override
  State<ChooseActionScreen> createState() => _ChooseActionScreenState();
}

class _ChooseActionScreenState extends State<ChooseActionScreen> {
  List<ServiceInfo> _services = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final services = await getServicesCatalog();
      
      if (mounted) {
        setState(() {
          _services = services.where((service) => service.actions.isNotEmpty).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Action'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Step 1: Choose a Trigger',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Select a service and trigger that will start your automation',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 16),
                          Text('Loading actions from backend...'),
                        ],
                      ),
                    )
                  : _error != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.error_outline,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              const Text(
                                'Failed to load services',
                                style: TextStyle(fontSize: 18),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.grey),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadServices,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : SingleChildScrollView(
                          child: Column(
                            children: [
                              // Backend Services Section
                              if (_services.isNotEmpty) ...[
                                const Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    'Available Services',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                ..._services.map((service) => Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: ExpansionTile(
                                    leading: CircleAvatar(
                                      backgroundColor: Colors.deepPurple,
                                      child: Icon(
                                        service.icon,
                                        color: Colors.white,
                                      ),
                                    ),
                                    title: Text(service.name),
                                    subtitle: Text(
                                      '${service.actions.length} available triggers',
                                    ),
                                    children: service.actions
                                        .map((action) => ListTile(
                                              title: Text(action.name),
                                              subtitle: Text(action.description),
                                              trailing: const Icon(Icons.chevron_right),
                                              onTap: () {
                                                Navigator.pushNamed(
                                                  context,
                                                  '/choose-reactions',
                                                  arguments: {
                                                    'trigger': action.name,
                                                    'service': service.name,
                                                    'actionObject': action,
                                                    'serviceObject': service,
                                                  },
                                                );
                                              },
                                            ))
                                        .toList(),
                                  ),
                                )).toList(),
                                const SizedBox(height: 24),
                              ],
                              
                              // Unimplemented Services Section (Placeholders)
                              const Align(
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  'Additional Services (Coming Soon)',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 12),
                              
                              // Notifications placeholder
                              Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: Colors.grey.shade100,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.grey.shade400,
                                    child: const Icon(
                                      Icons.notifications_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: const Text(
                                    'Notifications',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  subtitle: const Text(
                                    'Scheduled notifications, reminders - Not yet implemented',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  trailing: const Icon(
                                    Icons.construction,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              
                              // Weather placeholder
                              Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: Colors.grey.shade100,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.grey.shade400,
                                    child: const Icon(
                                      Icons.wb_sunny_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: const Text(
                                    'Weather',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  subtitle: const Text(
                                    'Weather changes, alerts - Not yet implemented',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  trailing: const Icon(
                                    Icons.construction,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              
                              // Calendar placeholder
                              Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: Colors.grey.shade100,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.grey.shade400,
                                    child: const Icon(
                                      Icons.calendar_today_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: const Text(
                                    'Calendar',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  subtitle: const Text(
                                    'Calendar events, reminders - Not yet implemented',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  trailing: const Icon(
                                    Icons.construction,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              
                              // Show empty state if no backend services
                              if (_services.isEmpty) ...[
                                const SizedBox(height: 40),
                                const Icon(
                                  Icons.auto_awesome_outlined,
                                  size: 64,
                                  color: Colors.grey,
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'No actions available yet',
                                  style: TextStyle(fontSize: 18),
                                ),
                                const Text(
                                  'Backend services will appear here when configured',
                                  style: TextStyle(color: Colors.grey),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
