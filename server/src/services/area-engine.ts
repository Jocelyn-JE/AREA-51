import { getService, serviceRegistry } from "./index";
import { db } from "../mongodb";
import { ObjectId } from "mongodb";
import { Parameter } from "./types";
import { oauthTokenManager } from "./oauth-token-manager";

// Enhanced Area type with parameters
export type AreaExecution = {
    _id?: ObjectId;
    actionServiceName: string;
    actionName: string;
    actionParameters: Record<string, unknown>;
    reactionServiceName: string;
    reactionName: string;
    reactionParameters: Record<string, unknown>;
    userId: ObjectId;
    enabled: boolean;
    createdAt: Date;
    lastTriggered?: Date;
};

function getMissingParams(
    definedParams: Parameter[],
    providedParams: Record<string, unknown> | undefined
): string[] {
    return definedParams
        .filter((p) => p.required)
        .filter((p) => !(p.name in (providedParams || {})))
        .map((p) => p.name);
}

export class AreaEngine {
    private static instance: AreaEngine;

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get the singleton instance of the AreaEngine
     */
    static getInstance(): AreaEngine {
        if (!AreaEngine.instance) AreaEngine.instance = new AreaEngine();
        return AreaEngine.instance;
    }

    /**
     * Execute a specific area (trigger action and run reaction)
     */
    async executeArea(areaId: ObjectId): Promise<void> {
        const area = await db
            .collection<AreaExecution>("areas")
            .findOne({ _id: areaId });

        if (!area || !area.enabled)
            throw new Error(`Area ${areaId} not found or disabled`);
        try {
            // Get user's OAuth tokens
            const userTokens = await oauthTokenManager.getAllTokensForUser(area.userId);
            const context = {
                userId: area.userId,
                userTokens
            };

            // Get services
            const actionService = getService(area.actionServiceName);
            const reactionService = getService(area.reactionServiceName);
            if (!actionService || !reactionService) {
                throw new Error(
                    `Services not found: ${area.actionServiceName} or ${area.reactionServiceName}`
                );
            }

            // Execute action (check if trigger condition is met) with user context
            console.log(
                `Checking trigger: ${area.actionServiceName}.${area.actionName}`
            );
            const triggerResult = await actionService.executeAction(
                area.actionName,
                area.actionParameters,
                context
            );

            // If trigger returns data (meaning condition was met), execute reaction
            if (triggerResult) {
                console.log(
                    `Trigger fired. Executing reaction: ${area.reactionServiceName}.${area.reactionName}`
                );
                // You can pass trigger data to reaction parameters
                const reactionParams = {
                    ...area.reactionParameters,
                    triggerData: triggerResult
                };
                await reactionService.executeReaction(
                    area.reactionName,
                    reactionParams,
                    context
                );
                await db.collection<AreaExecution>("areas").updateOne(
                    { _id: areaId },
                    { $set: { lastTriggered: new Date() } } // Update last triggered timestamp
                );
                console.log(`Area ${areaId} executed successfully`);
            }
        } catch (error) {
            console.error(`Error executing area ${areaId}:`, error);
            throw error;
        }
    }

    /**
     * Execute a reaction directly with parameters
     */
    async executeReaction(
        serviceName: string,
        reactionName: string,
        parameters: Record<string, unknown>
    ): Promise<void> {
        const service = serviceRegistry.get(serviceName);
        if (!service) throw new Error(`Service ${serviceName} not found`);
        await service.executeReaction(reactionName, parameters);
    }

    /**
     * Monitor all enabled areas (this would be called periodically)
     */
    async monitorAreas(): Promise<void> {
        const enabledAreas = await db
            .collection<AreaExecution>("areas")
            .find({ enabled: true })
            .toArray();

        console.log(`Monitoring ${enabledAreas.length} enabled areas`);
        // Process in batches of 10 to avoid overwhelming the system
        for (let i = 0; i < enabledAreas.length; i += 10) {
            const batch = enabledAreas.slice(i, i + 10);
            const promises = batch.map(async (area) => {
                if (!area._id) return Promise.resolve();
                try {
                    return await this.executeArea(area._id);
                } catch (error) {
                    console.error(`Failed to execute area ${area._id}:`, error);
                    return Promise.resolve();
                }
            });
            await Promise.all(promises);
        }
    }

    /**
     * Validate area parameters against service definitions
     */
    async validateArea(area: AreaExecution): Promise<string[]> {
        const errors: string[] = [];
        if (!area.actionServiceName || !area.reactionServiceName) {
            errors.push("Both service names are required");
            return errors;
        }

        const actionService = getService(area.actionServiceName);
        const reactionService = getService(area.reactionServiceName);
        if (!actionService)
            errors.push(`Action service '${area.actionServiceName}' not found`);
        if (!reactionService) {
            errors.push(
                `Reaction service '${area.reactionServiceName}' not found`
            );
        }
        if (actionService && area.actionName) {
            const action = actionService.getAction(area.actionName);
            if (!action) {
                errors.push(
                    `Action '${area.actionName}' not found in service '${area.actionServiceName}'`
                );
            } else {
                // Validate required parameters
                const missingParams = getMissingParams(
                    action.parameters,
                    area.actionParameters
                );
                if (missingParams.length > 0) {
                    errors.push(
                        `Missing required 'actionParameters': ${missingParams.join(", ")}`
                    );
                }
            }
        }
        if (reactionService && area.reactionName) {
            const reaction = reactionService.getReaction(area.reactionName);
            if (!reaction) {
                errors.push(
                    `Reaction '${area.reactionName}' not found in service '${area.reactionServiceName}'`
                );
            } else {
                // Validate required parameters
                const missingParams = getMissingParams(
                    reaction.parameters,
                    area.reactionParameters
                );
                if (missingParams.length > 0) {
                    errors.push(
                        `Missing required 'reactionParameters': ${missingParams.join(", ")}`
                    );
                }
            }
        }
        return errors;
    }
}

// Export singleton instance
export const areaEngine = AreaEngine.getInstance();
