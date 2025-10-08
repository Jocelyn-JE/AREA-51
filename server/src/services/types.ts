import { ObjectId } from "mongodb";

// Parameter definition for actions/reactions
export type Parameter = {
    name: string;
    type: "string" | "number" | "boolean" | "email" | "url" | "select";
    description: string;
    required: boolean;
    options?: string[]; // For 'select' type (dropdown options)
    defaultValue?: string | number | boolean;
};

// User execution context with OAuth tokens to use in actions/reactions
export interface ServiceExecutionContext {
    userId: ObjectId;
    userTokens: Record<string, string>; // serviceName -> accessToken
}

// Action with executable function and parameters
export type Action = {
    name: string;
    description: string;
    parameters: Parameter[];
    execute: (
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ) => Promise<unknown | null>; // Returns data if trigger condition met, null if not
};

// Reaction with executable function and parameters
export type Reaction = {
    name: string;
    description: string;
    parameters: Parameter[];
    execute: (
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ) => Promise<void>; // No return value, just performs the action
};

// For API responses (without executable functions)
export type ActionDefinition = Omit<Action, "execute">;

export type ReactionDefinition = Omit<Reaction, "execute">;

// Abstract base class for service implementations
export abstract class BaseService {
    protected readonly _name: string;
    protected readonly _actions: Action[];
    protected readonly _reactions: Reaction[];

    constructor(name: string, actions: Action[], reactions: Reaction[]) {
        this._name = name;
        this._actions = actions;
        this._reactions = reactions;
    }

    // Getters for shared properties
    get name(): string {
        return this._name;
    }

    get actions(): Action[] {
        return [...this._actions]; // Return copy to prevent mutation
    }

    get reactions(): Reaction[] {
        return [...this._reactions]; // Return copy to prevent mutation
    }

    // Get action/reaction definitions for API responses (without functions)
    get actionDefinitions(): ActionDefinition[] {
        return this._actions.map(({ name, description, parameters }) => ({
            name,
            description,
            parameters
        }));
    }

    get reactionDefinitions(): ReactionDefinition[] {
        return this._reactions.map(({ name, description, parameters }) => ({
            name,
            description,
            parameters
        }));
    }

    getAction(action: string): Action | undefined {
        return this._actions.find((a) => a.name === action);
    }

    getReaction(reaction: string): Reaction | undefined {
        return this._reactions.find((r) => r.name === reaction);
    }

    // Find and execute action
    async executeAction(
        actionName: string,
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown> {
        const action = this._actions.find((a) => a.name === actionName);
        if (!action) {
            throw new Error(
                `Action '${actionName}' not found in service '${this._name}'`
            );
        }
        return action.execute(params, context);
    }

    // Find and execute reaction
    async executeReaction(
        reactionName: string,
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<void> {
        const reaction = this._reactions.find((r) => r.name === reactionName);
        if (!reaction) {
            throw new Error(
                `Reaction '${reactionName}' not found in service '${this._name}'`
            );
        }
        await reaction.execute(params, context);
    }

    // Abstract method that each service must implement
    abstract initialize(): Promise<void>;
}
