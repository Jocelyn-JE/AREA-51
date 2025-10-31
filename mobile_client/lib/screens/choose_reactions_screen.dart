import 'package:flutter/material.dart';
import '../services/service_catalog.dart';

class ChooseReactionsScreen extends StatefulWidget {
  const ChooseReactionsScreen({super.key});

  @override
  State<ChooseReactionsScreen> createState() => _ChooseReactionsScreenState();
}

class _ChooseReactionsScreenState extends State<ChooseReactionsScreen> {
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
          _services = services.where((service) => service.reactions.isNotEmpty).toList();
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
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final trigger = args?['trigger'] ?? 'Selected Trigger';
    final triggerService = args?['service'] ?? 'Service';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose Reactions'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Step 2: Choose Reactions',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Select actions that will happen when your trigger is activated',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Icon(Icons.info, color: Colors.blue),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Selected Trigger',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text('$triggerService: $trigger'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
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
                          Text('Loading reactions from backend...'),
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
                                      backgroundColor: Colors.green,
                                      child: Icon(
                                        service.icon,
                                        color: Colors.white,
                                      ),
                                    ),
                                    title: Text(service.name),
                                    subtitle: Text(
                                      '${service.reactions.length} available reactions',
                                    ),
                                    children: service.reactions
                                        .map((reaction) => ListTile(
                                              title: Text(reaction.name),
                                              subtitle: Text(reaction.description),
                                              trailing: const Icon(Icons.chevron_right),
                                              onTap: () {
                                                Navigator.pushNamed(
                                                  context,
                                                  '/confirm-naming',
                                                  arguments: {
                                                    'trigger': trigger,
                                                    'triggerService': triggerService,
                                                    'reaction': reaction.name,
                                                    'reactionService': service.name,
                                                    'reactionObject': reaction,
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
                                    'Push notifications, SMS, etc. - Not yet implemented',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  trailing: const Icon(
                                    Icons.construction,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              
                              // Device Controls placeholder
                              Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: Colors.grey.shade100,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.grey.shade400,
                                    child: const Icon(
                                      Icons.devices_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: const Text(
                                    'Device Controls',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  subtitle: const Text(
                                    'Smart home, IoT devices - Not yet implemented',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  trailing: const Icon(
                                    Icons.construction,
                                    color: Colors.grey,
                                  ),
                                ),
                              ),
                              
                              // Social Media placeholder
                              Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                color: Colors.grey.shade100,
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: Colors.grey.shade400,
                                    child: const Icon(
                                      Icons.share_outlined,
                                      color: Colors.white,
                                    ),
                                  ),
                                  title: const Text(
                                    'Social Media',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                  subtitle: const Text(
                                    'Twitter, Facebook posts - Not yet implemented',
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
                                  'No reactions available yet',
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
