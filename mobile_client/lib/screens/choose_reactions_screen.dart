import 'package:flutter/material.dart';

class ChooseReactionsScreen extends StatelessWidget {
  const ChooseReactionsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final trigger = args?['trigger'] ?? 'Selected Trigger';
    final triggerService = args?['service'] ?? 'Service';

    final reactions = [
      {
        'service': 'Discord',
        'icon': Icons.chat,
        'reactions': ['Send Message', 'Create Channel', 'Send DM', 'Update Status']
      },
      {
        'service': 'Gmail',
        'icon': Icons.email,
        'reactions': ['Send Email', 'Create Draft', 'Add Label', 'Mark as Read']
      },
      {
        'service': 'Spotify',
        'icon': Icons.music_note,
        'reactions': ['Add to Playlist', 'Play Song', 'Pause Music', 'Skip Track']
      },
      {
        'service': 'Notifications',
        'icon': Icons.notifications,
        'reactions': ['Push Notification', 'SMS Alert', 'Email Alert']
      },
    ];

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
              child: ListView.builder(
                itemCount: reactions.length,
                itemBuilder: (context, index) {
                  final service = reactions[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ExpansionTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.green,
                        child: Icon(
                          service['icon'] as IconData,
                          color: Colors.white,
                        ),
                      ),
                      title: Text(service['service'] as String),
                      subtitle: Text(
                        '${(service['reactions'] as List).length} available reactions',
                      ),
                      children: (service['reactions'] as List<String>)
                          .map((reaction) => ListTile(
                                title: Text(reaction),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  Navigator.pushNamed(
                                    context,
                                    '/confirm-naming',
                                    arguments: {
                                      'trigger': trigger,
                                      'triggerService': triggerService,
                                      'reaction': reaction,
                                      'reactionService': service['service'],
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
