import 'package:flutter/material.dart';

class ChooseActionScreen extends StatelessWidget {
  const ChooseActionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final actions = [
      {
        'service': 'GitHub',
        'icon': Icons.code,
        'actions': ['New Issue', 'New Pull Request', 'New Commit', 'New Star']
      },
      {
        'service': 'Discord',
        'icon': Icons.chat,
        'actions': ['New Message', 'User Joined', 'Voice Channel Activity']
      },
      {
        'service': 'Spotify',
        'icon': Icons.music_note,
        'actions': ['Song Started', 'Playlist Updated', 'New Follow']
      },
      {
        'service': 'Gmail',
        'icon': Icons.email,
        'actions': ['New Email', 'Email with Subject', 'Email from Sender']
      },
    ];

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
              child: ListView.builder(
                itemCount: actions.length,
                itemBuilder: (context, index) {
                  final service = actions[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ExpansionTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.deepPurple,
                        child: Icon(
                          service['icon'] as IconData,
                          color: Colors.white,
                        ),
                      ),
                      title: Text(service['service'] as String),
                      subtitle: Text(
                        '${(service['actions'] as List).length} available triggers',
                      ),
                      children: (service['actions'] as List<String>)
                          .map((action) => ListTile(
                                title: Text(action),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  Navigator.pushNamed(
                                    context,
                                    '/choose-reactions',
                                    arguments: {
                                      'trigger': action,
                                      'service': service['service'],
                                    },
                                  );
                                },
                              ))
                          .toList(),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
