import 'package:flutter/material.dart';
import '../widgets/app_bottom_nav.dart';
import 'service_catalog.dart';

class ServicesScreen extends StatefulWidget {
  const ServicesScreen({super.key});

  @override
  State<ServicesScreen> createState() => _ServicesScreenState();
}

class _ServicesScreenState extends State<ServicesScreen> {
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
          _services = services;
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

  Future<void> _refreshServices() async {
    await _loadServices();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Services'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _refreshServices,
            tooltip: 'Refresh Services',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Available Services',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _isLoading 
                  ? 'Loading services from backend...'
                  : _error != null
                      ? 'Error loading services from backend'
                      : _services.isEmpty
                          ? 'No services available from backend'
                          : 'Services loaded from backend API',
              style: TextStyle(
                fontSize: 16, 
                color: _error != null ? Colors.red : Colors.grey,
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
                          Text('Loading services from backend...'),
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
                              Text(
                                'Failed to load services',
                                style: TextStyle(
                                  fontSize: 18,
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _error!,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey[500],
                                ),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _refreshServices,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : _services.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.integration_instructions,
                                    size: 64,
                                    color: Colors.grey[400],
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No services available',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Backend returned no services',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ElevatedButton(
                                    onPressed: _refreshServices,
                                    child: const Text('Refresh'),
                                  ),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _refreshServices,
                              child: ListView.builder(
                                itemCount: _services.length,
                                itemBuilder: (context, index) {
                                  final service = _services[index];
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    child: ListTile(
                                      leading: CircleAvatar(
                                        backgroundColor:
                                            service.connected ? Colors.green : Colors.grey,
                                        child: Icon(
                                          service.icon,
                                          color: Colors.white,
                                        ),
                                      ),
                                      title: Text(service.name),
                                      subtitle: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(service.description),
                                          const SizedBox(height: 4),
                                          Text(
                                            '${service.actions.length} actions, ${service.reactions.length} reactions',
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey,
                                            ),
                                          ),
                                        ],
                                      ),
                                      trailing: service.connected
                                          ? const Icon(Icons.check_circle, color: Colors.green)
                                          : ElevatedButton(
                                              onPressed: () {
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    content: Text(
                                                      'Service connection not yet implemented for ${service.name}',
                                                    ),
                                                  ),
                                                );
                                              },
                                              child: const Text('Connect'),
                                            ),
                                      isThreeLine: true,
                                    ),
                                  );
                                },
                              ),
                            ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const AppBottomNav(currentIndex: 2),
    );
  }
}