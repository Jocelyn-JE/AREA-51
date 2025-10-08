# Service Implementation Guide

This guide explains how to implement a new service in the AREA platform following the current architecture patterns.

## Overview

Services in AREA follow an action-reaction pattern where:

- **Actions** are triggers that monitor for events and return data when conditions are met
- **Reactions** are responses that perform operations when triggered

All services extend the `BaseService` abstract class which provides a standardized interface.

## Service Architecture

### Core Components

1. **BaseService Abstract Class** [`/server/src/services/types.ts`](../server/src/services/types.ts)
   - Provides the foundation for all services
   - Manages actions and reactions collections
   - Handles execution logic
   - Requires implementation of `initialize()` method

2. **Parameter System**
   - Type-safe parameter definitions
   - Support for various data types: `string`, `number`, `boolean`, `email`, `url`, `select`
   - Optional/required parameter validation
   - Default values and dropdown options

3. **Execution Context**
   - Provides user authentication tokens
   - Passes user ID for data isolation
   - Enables secure API calls to external services

## Step-by-Step Implementation

### 1. Create the Service Class

Create a new file in [`src/services/`](../server/src/services/) (e.g., `my-service.ts`):

```typescript
import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext,
    Parameter
} from "./types";

export class MyService extends BaseService {
    constructor() {
        const actions: Action[] = [
            // Define your actions here
        ];

        const reactions: Reaction[] = [
            // Define your reactions here
        ];

        super("My Service", actions, reactions);
    }

    async initialize(): Promise<void> {
        // Initialize your service (setup connections, validate config, etc.)
        console.log("MyService initialized");
    }

    // Add your private helper methods here
}
```

### 2. Define Actions (Triggers)

Actions monitor for events and return data when triggered. They should return:

- **Data `object`** when the trigger condition is met, it can be any structured data relevant to the event.
It can be any structured data relevant to the event.
This could include:
  - Event metadata (timestamps, IDs)
  - Relevant details about the event
  - Any other structured information that downstream reactions might need
- **`null`** when no trigger condition is met

```typescript
const actions: Action[] = [
    {
        name: "event_happened",
        description: "Triggered when a specific event occurs",
        parameters: [
            {
                name: "filter_value",
                type: "string",
                description: "Filter events by this value",
                required: false
            },
            {
                name: "check_interval",
                type: "number",
                description: "Check interval in seconds",
                required: false,
                defaultValue: 60
            }
        ],
        execute: async (params, context) => {
            return this.checkForEvent(params, context);
        }
    }
];
```

### 3. Define Reactions (Actions)

Reactions perform operations when triggered. They should:

- Execute the desired action
- Not return any value (`void`)
- Handle errors appropriately

```typescript
const reactions: Reaction[] = [
    {
        name: "perform_action",
        description: "Performs a specific action",
        parameters: [
            {
                name: "target",
                type: "string",
                description: "Target for the action",
                required: true
            },
            {
                name: "action_type",
                type: "select",
                description: "Type of action to perform",
                required: true,
                options: ["create", "update", "delete"]
            }
        ],
        execute: async (params, context) => {
            await this.performAction(
                params.target as string,
                params.action_type as string,
                context
            );
        }
    }
];
```

### 4. Implement Helper Methods

Create private methods to handle the actual business logic:

```typescript
private async checkForEvent(
    params: Record<string, unknown>,
    context?: ServiceExecutionContext
): Promise<unknown | null> {
    try {
        // Your trigger logic here
        const filterValue = params.filter_value as string;
        
        // Check for your event condition
        const eventData = await this.queryExternalAPI(filterValue, context);
        
        if (eventData) {
            // Return event data if condition is met
            return {
                eventId: eventData.id,
                timestamp: new Date().toISOString(),
                data: eventData
            };
        }
        
        // Return null if no trigger condition met
        return null;
    } catch (error) {
        console.error("Error checking for event:", error);
        throw error;
    }
}

private async performAction(
    target: string,
    actionType: string,
    context?: ServiceExecutionContext
): Promise<void> {
    try {
        // Your reaction logic here
        const userToken = context?.userTokens[this.name];
        
        switch (actionType) {
            case "create":
                await this.createResource(target, userToken);
                break;
            case "update":
                await this.updateResource(target, userToken);
                break;
            case "delete":
                await this.deleteResource(target, userToken);
                break;
        }
    } catch (error) {
        console.error("Error performing action:", error);
        throw error;
    }
}
```

### 5. Register the Service

Add your service to the service registry in [`src/services/index.ts`](../server/src/services/index.ts):

```typescript
// Export your service
export { MyService } from "./my-service";

// Add to imports
import { MyService } from "./my-service";

// Add to service registry
export const serviceRegistry: Map<string, BaseService> = new Map<
string,
BaseService
>([
    ["Gmail", new GmailService()],
    ["Google Drive", new GoogleDriveService()],
    ["My Service", new MyService()] // Add your service here
]);
```

## Best Practices

### Parameter Design

- Use descriptive parameter names and descriptions
- Set appropriate `required` flags
- Provide sensible default values
- Use `select` type for predefined options
- Validate parameter types in your methods

### Error Handling

- Always wrap API calls in try-catch blocks
- Provide meaningful error messages
- Log errors for debugging
- Re-throw errors to allow proper error propagation

### Authentication

- Use the `ServiceExecutionContext` for user tokens
- Validate token availability before API calls
- Handle token refresh if supported by the external service
- Respect rate limits and quotas

### Data Format

- Return consistent data structures from actions
- Include relevant metadata (timestamps, IDs)
- Document the expected return format
- Handle edge cases (empty results, API errors)

### Async Operations

- Always use `async/await` for external API calls
- Handle timeouts appropriately
- Consider implementing retry logic for failed requests
- Use proper error propagation

## Example: Weather Service

Here's a complete example of a weather service implementation:

```typescript
import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext
} from "./types";

export class WeatherService extends BaseService {
    private apiKey: string;

    constructor() {
        const actions: Action[] = [
            {
                name: "weather_changed",
                description: "Triggered when weather conditions change",
                parameters: [
                    {
                        name: "city",
                        type: "string",
                        description: "City to monitor",
                        required: true
                    },
                    {
                        name: "condition",
                        type: "select",
                        description: "Weather condition to monitor",
                        required: true,
                        options: ["sunny", "rainy", "cloudy", "snowy"]
                    }
                ],
                execute: async (params, context) => {
                    return this.checkWeather(params, context);
                }
            }
        ];

        const reactions: Reaction[] = [
            {
                name: "send_weather_alert",
                description: "Send a weather alert notification",
                parameters: [
                    {
                        name: "message",
                        type: "string",
                        description: "Alert message",
                        required: true
                    },
                    {
                        name: "recipient",
                        type: "email",
                        description: "Alert recipient",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    await this.sendAlert(
                        params.message as string,
                        params.recipient as string,
                        context
                    );
                }
            }
        ];

        super("Weather", actions, reactions);
        this.apiKey = process.env.WEATHER_API_KEY || "";
    }

    async initialize(): Promise<void> {
        if (!this.apiKey) {
            throw new Error("Weather API key not configured");
        }
        console.log("WeatherService initialized");
    }

    private async checkWeather(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<any | null> {
        const city = params.city as string;
        const targetCondition = params.condition as string;

        try {
            const response = await fetch(
                `https://api.weather.com/v1/current?city=${city}&key=${this.apiKey}`
            );
            const weatherData = await response.json();

            if (weatherData.condition === targetCondition) {
                return {
                    city,
                    condition: weatherData.condition,
                    temperature: weatherData.temperature,
                    timestamp: new Date().toISOString()
                };
            }

            return null;
        } catch (error) {
            console.error("Weather check failed:", error);
            throw error;
        }
    }

    private async sendAlert(
        message: string,
        recipient: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        // Implementation for sending alerts
        console.log(`Sending alert to ${recipient}: ${message}`);
    }
}
```

## Testing Your Service

1. **Unit Tests**: Test individual methods with mock data
2. **Integration Tests**: Test with real API calls (in development)
3. **Error Scenarios**: Test error handling and edge cases
4. **Parameter Validation**: Ensure parameters are properly validated

## Deployment Checklist

- [ ] Service class extends `BaseService`
- [ ] `initialize()` method implemented
- [ ] Actions return data or null appropriately
- [ ] Reactions handle errors gracefully
- [ ] Service registered in `index.ts`
- [ ] Environment variables configured
- [ ] API credentials secured
- [ ] Error logging implemented
- [ ] Documentation updated
- [ ] Tests written and passing

## Common Patterns

### Polling-based Actions

For services that need to check external APIs periodically:

```typescript
private lastCheckTime: Date = new Date(0);

private async checkForUpdates(): Promise<any | null> {
    const now = new Date();
    const updates = await this.fetchUpdatesSince(this.lastCheckTime);
    this.lastCheckTime = now;
    
    return updates.length > 0 ? updates : null;
}
```

### Webhook-based Actions

For services that receive real-time notifications:

```typescript
// In your router or webhook handler
app.post('/webhook/myservice', (req, res) => {
    const service = getService('My Service') as MyService;
    service.handleWebhook(req.body);
    res.status(200).send('OK');
});
```

### Rate-limited APIs

For APIs with rate limits:

```typescript
private rateLimiter = new Map<string, number>();

private async makeAPICall(endpoint: string): Promise<any> {
    const lastCall = this.rateLimiter.get(endpoint) || 0;
    const minInterval = 1000; // 1 second
    
    if (Date.now() - lastCall < minInterval) {
        await new Promise(resolve => 
            setTimeout(resolve, minInterval - (Date.now() - lastCall))
        );
    }
    
    this.rateLimiter.set(endpoint, Date.now());
    return fetch(endpoint);
}
```

This guide should help you implement new services that integrate seamlessly with the existing AREA platform architecture.
