class ServiceParameter {
  final String name;
  final String type;
  final String description;
  final bool required;
  final List<String>? options;
  final String? defaultValue;

  const ServiceParameter({
    required this.name,
    required this.type,
    required this.description,
    required this.required,
    this.options,
    this.defaultValue,
  });

  factory ServiceParameter.fromJson(Map<String, dynamic> json) {
    return ServiceParameter(
      name: json['name'] as String,
      type: json['type'] as String,
      description: json['description'] as String,
      required: json['required'] as bool,
      options: json['options'] != null
          ? List<String>.from(json['options'] as List)
          : null,
      defaultValue: json['defaultValue'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'description': description,
      'required': required,
      if (options != null) 'options': options,
      if (defaultValue != null) 'defaultValue': defaultValue,
    };
  }

  @override
  String toString() {
    return 'ServiceParameter{name: $name, type: $type, required: $required}';
  }
}

class ServiceAction {
  final String name;
  final String description;
  final List<ServiceParameter> parameters;

  const ServiceAction({
    required this.name,
    required this.description,
    required this.parameters,
  });

  factory ServiceAction.fromJson(Map<String, dynamic> json) {
    return ServiceAction(
      name: json['name'] as String,
      description: json['description'] as String,
      parameters: (json['parameters'] as List<dynamic>)
          .map((param) => ServiceParameter.fromJson(param as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'parameters': parameters.map((param) => param.toJson()).toList(),
    };
  }

  @override
  String toString() {
    return 'ServiceAction{name: $name, description: $description, parameters: ${parameters.length}}';
  }
}

class ServiceReaction {
  final String name;
  final String description;
  final List<ServiceParameter> parameters;

  const ServiceReaction({
    required this.name,
    required this.description,
    required this.parameters,
  });

  factory ServiceReaction.fromJson(Map<String, dynamic> json) {
    return ServiceReaction(
      name: json['name'] as String,
      description: json['description'] as String,
      parameters: (json['parameters'] as List<dynamic>)
          .map((param) => ServiceParameter.fromJson(param as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'parameters': parameters.map((param) => param.toJson()).toList(),
    };
  }

  @override
  String toString() {
    return 'ServiceReaction{name: $name, description: $description, parameters: ${parameters.length}}';
  }
}

class Service {
  final String name;
  final List<ServiceAction> actions;
  final List<ServiceReaction> reactions;

  const Service({
    required this.name,
    required this.actions,
    required this.reactions,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      name: json['name'] as String,
      actions: (json['actions'] as List<dynamic>)
          .map((action) => ServiceAction.fromJson(action as Map<String, dynamic>))
          .toList(),
      reactions: (json['reactions'] as List<dynamic>)
          .map((reaction) => ServiceReaction.fromJson(reaction as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'actions': actions.map((action) => action.toJson()).toList(),
      'reactions': reactions.map((reaction) => reaction.toJson()).toList(),
    };
  }

  @override
  String toString() {
    return 'Service{name: $name, actions: ${actions.length}, reactions: ${reactions.length}}';
  }
}

class Area {
  final String id;
  final String actionServiceName;
  final String actionName;
  final Map<String, dynamic> actionParameters;
  final String reactionServiceName;
  final String reactionName;
  final Map<String, dynamic> reactionParameters;
  final String userId;
  final bool enabled;
  final DateTime createdAt;
  final String? name;
  final String? description;

  const Area({
    required this.id,
    required this.actionServiceName,
    required this.actionName,
    required this.actionParameters,
    required this.reactionServiceName,
    required this.reactionName,
    required this.reactionParameters,
    required this.userId,
    required this.enabled,
    required this.createdAt,
    this.name,
    this.description,
  });

  factory Area.fromJson(Map<String, dynamic> json) {
    return Area(
      id: json['_id'] as String,
      actionServiceName: json['actionServiceName'] as String,
      actionName: json['actionName'] as String,
      actionParameters: Map<String, dynamic>.from(json['actionParameters'] as Map),
      reactionServiceName: json['reactionServiceName'] as String,
      reactionName: json['reactionName'] as String,
      reactionParameters: Map<String, dynamic>.from(json['reactionParameters'] as Map),
      userId: json['userId'] as String,
      enabled: json['enabled'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      name: json['name'] as String?,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'actionServiceName': actionServiceName,
      'actionName': actionName,
      'actionParameters': actionParameters,
      'reactionServiceName': reactionServiceName,
      'reactionName': reactionName,
      'reactionParameters': reactionParameters,
      'userId': userId,
      'enabled': enabled,
      'createdAt': createdAt.toIso8601String(),
      if (name != null) 'name': name,
      if (description != null) 'description': description,
    };
  }

  @override
  String toString() {
    return 'Area{id: $id, name: $name, enabled: $enabled, actionServiceName: $actionServiceName, reactionServiceName: $reactionServiceName}';
  }
}

class AboutResponse {
  final Map<String, dynamic> client;
  final Map<String, dynamic> server;

  const AboutResponse({
    required this.client,
    required this.server,
  });

  factory AboutResponse.fromJson(Map<String, dynamic> json) {
    return AboutResponse(
      client: Map<String, dynamic>.from(json['client'] as Map),
      server: Map<String, dynamic>.from(json['server'] as Map),
    );
  }

  List<Service> get services {
    if (server['services'] != null) {
      return (server['services'] as List<dynamic>)
          .map((service) => Service.fromJson(service as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  int? get currentTime => server['current_time'] as int?;
  String? get clientHost => client['host'] as String?;

  Map<String, dynamic> toJson() {
    return {
      'client': client,
      'server': server,
    };
  }

  @override
  String toString() {
    return 'AboutResponse{clientHost: $clientHost, servicesCount: ${services.length}}';
  }
}
