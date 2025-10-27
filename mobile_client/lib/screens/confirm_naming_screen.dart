import 'package:flutter/material.dart';
import '../services/api_service.dart';

class ConfirmNamingScreen extends StatefulWidget {
  const ConfirmNamingScreen({super.key});

  @override
  State<ConfirmNamingScreen> createState() => _ConfirmNamingScreenState();
}

class _ConfirmNamingScreenState extends State<ConfirmNamingScreen> {
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _apiService = ApiService();
  bool _isEnabled = true;
  bool _isCreating = false;
  
  // Store parameters
  final Map<String, TextEditingController> _actionParamControllers = {};
  final Map<String, TextEditingController> _reactionParamControllers = {};

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    for (var controller in _actionParamControllers.values) {
      controller.dispose();
    }
    for (var controller in _reactionParamControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _initializeParameters(Map<String, dynamic> args) {
    final actionObject = args['actionObject'];
    final reactionObject = args['reactionObject'];
    
    if (actionObject != null && actionObject.parameters != null) {
      for (var param in actionObject.parameters) {
        if (!_actionParamControllers.containsKey(param.name)) {
          _actionParamControllers[param.name] = TextEditingController(
            text: param.defaultValue ?? '',
          );
        }
      }
    }
    
    if (reactionObject != null && reactionObject.parameters != null) {
      for (var param in reactionObject.parameters) {
        if (!_reactionParamControllers.containsKey(param.name)) {
          _reactionParamControllers[param.name] = TextEditingController(
            text: param.defaultValue ?? '',
          );
        }
      }
    }
  }

  Future<void> _createArea(Map<String, dynamic> args) async {
    if (_nameController.text.trim().isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please enter a name for your Area'),
          ),
        );
      }
      return;
    }

    setState(() {
      _isCreating = true;
    });

    try {
      final actionObject = args['actionObject'];
      final reactionObject = args['reactionObject'];
      
      // Build action parameters
      final Map<String, dynamic> actionParameters = {};
      if (actionObject?.parameters != null) {
        for (var param in actionObject.parameters) {
          final controller = _actionParamControllers[param.name];
          if (controller != null && controller.text.isNotEmpty) {
            actionParameters[param.name] = controller.text;
          } else if (param.required) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Please fill in required action parameter: ${param.name}'),
                  backgroundColor: Colors.red,
                ),
              );
            }
            setState(() {
              _isCreating = false;
            });
            return;
          }
        }
      }

      // Build reaction parameters
      final Map<String, dynamic> reactionParameters = {};
      if (reactionObject?.parameters != null) {
        for (var param in reactionObject.parameters) {
          final controller = _reactionParamControllers[param.name];
          if (controller != null && controller.text.isNotEmpty) {
            reactionParameters[param.name] = controller.text;
          } else if (param.required) {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Please fill in required reaction parameter: ${param.name}'),
                  backgroundColor: Colors.red,
                ),
              );
            }
            setState(() {
              _isCreating = false;
            });
            return;
          }
        }
      }

      final result = await _apiService.createArea(
        actionServiceName: args['triggerService'] ?? '',
        actionName: actionObject?.name ?? args['trigger'] ?? '',
        actionParameters: actionParameters,
        reactionServiceName: args['reactionService'] ?? '',
        reactionName: reactionObject?.name ?? args['reaction'] ?? '',
        reactionParameters: reactionParameters,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty 
            ? null 
            : _descriptionController.text.trim(),
      );

      if (mounted) {
        setState(() {
          _isCreating = false;
        });

        if (result['success']) {
          // Optionally enable/disable the area after creation
          if (!_isEnabled && result['data']?['area']?['_id'] != null) {
            await _apiService.toggleArea(result['data']['area']['_id'], false);
          }

          if (mounted) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (BuildContext context) {
                return AlertDialog(
                  title: const Text('Area Created!'),
                  content: Text(
                    'Your automation "${_nameController.text}" has been created successfully.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop(); // Close dialog
                        Navigator.of(context).pushNamedAndRemoveUntil(
                          '/my-areas',
                          (route) => route.settings.name == '/dashboard',
                        );
                      },
                      child: const Text('View My Areas'),
                    ),
                  ],
                );
              },
            );
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(result['error'] ?? 'Failed to create area'),
                backgroundColor: Colors.red,
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isCreating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    final trigger = args?['trigger'] ?? 'Trigger';
    final triggerService = args?['triggerService'] ?? 'Service';
    final reaction = args?['reaction'] ?? 'Reaction';
    final reactionService = args?['reactionService'] ?? 'Service';
    final actionObject = args?['actionObject'];
    final reactionObject = args?['reactionObject'];

    // Initialize parameters on first build
    if (_actionParamControllers.isEmpty && _reactionParamControllers.isEmpty) {
      _initializeParameters(args ?? {});
    }

    // Set default name if empty
    if (_nameController.text.isEmpty) {
      _nameController.text = '$triggerService to $reactionService';
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Name Your Area'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Step 3: Name & Configure',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Give your automation a name and configure parameters',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
            const SizedBox(height: 24),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Automation Summary',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Icon(Icons.play_arrow, color: Colors.blue),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'When: $triggerService - $trigger',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.arrow_forward, color: Colors.green),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Then: $reactionService - $reaction',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Area Name',
                hintText: 'Enter a name for your automation',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description (Optional)',
                hintText: 'Describe what this automation does',
                border: OutlineInputBorder(),
              ),
            ),
            
            // Action Parameters
            if (actionObject?.parameters != null && actionObject.parameters.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text(
                'Action Parameters',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...actionObject.parameters.map((param) {
                final controller = _actionParamControllers[param.name]!;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: param.type == 'select' && param.options != null
                      ? DropdownButtonFormField<String>(
                          value: controller.text.isEmpty ? param.defaultValue : controller.text,
                          decoration: InputDecoration(
                            labelText: '${param.name}${param.required ? ' *' : ''}',
                            hintText: param.description,
                            border: const OutlineInputBorder(),
                          ),
                          items: param.options!.map((option) {
                            return DropdownMenuItem(
                              value: option,
                              child: Text(option),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              controller.text = value;
                            }
                          },
                        )
                      : TextField(
                          controller: controller,
                          decoration: InputDecoration(
                            labelText: '${param.name}${param.required ? ' *' : ''}',
                            hintText: param.description,
                            border: const OutlineInputBorder(),
                          ),
                          keyboardType: param.type == 'email' 
                              ? TextInputType.emailAddress 
                              : TextInputType.text,
                        ),
                );
              }).toList(),
            ],
            
            // Reaction Parameters
            if (reactionObject?.parameters != null && reactionObject.parameters.isNotEmpty) ...[
              const SizedBox(height: 24),
              const Text(
                'Reaction Parameters',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...reactionObject.parameters.map((param) {
                final controller = _reactionParamControllers[param.name]!;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: param.type == 'select' && param.options != null
                      ? DropdownButtonFormField<String>(
                          value: controller.text.isEmpty ? param.defaultValue : controller.text,
                          decoration: InputDecoration(
                            labelText: '${param.name}${param.required ? ' *' : ''}',
                            hintText: param.description,
                            border: const OutlineInputBorder(),
                          ),
                          items: param.options!.map((option) {
                            return DropdownMenuItem(
                              value: option,
                              child: Text(option),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              controller.text = value;
                            }
                          },
                        )
                      : TextField(
                          controller: controller,
                          decoration: InputDecoration(
                            labelText: '${param.name}${param.required ? ' *' : ''}',
                            hintText: param.description,
                            border: const OutlineInputBorder(),
                          ),
                          keyboardType: param.type == 'email' 
                              ? TextInputType.emailAddress 
                              : TextInputType.text,
                        ),
                );
              }).toList(),
            ],
            
            const SizedBox(height: 16),
            SwitchListTile(
              title: const Text('Enable Area'),
              subtitle: const Text('Start this automation immediately'),
              value: _isEnabled,
              onChanged: (value) {
                setState(() {
                  _isEnabled = value;
                });
              },
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isCreating ? null : () => _createArea(args ?? {}),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isCreating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Create Area',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
