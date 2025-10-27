// Export types and base class
export { BaseService, Action, Reaction } from "./types";

// Export service implementations
export { GmailService } from "./gmail";
export { GoogleDriveService } from "./google-drive";

// Service registry for easy access
import { BaseService } from "./types";
import { GmailService } from "./gmail";
import { GoogleDriveService } from "./google-drive";
import { GitHubService } from "./github";

export const serviceRegistry: Map<string, BaseService> = new Map<
string,
BaseService
>([
    ["Gmail", new GmailService()],
    ["Google Drive", new GoogleDriveService()],
    ["GitHub", new GitHubService()]
]);

// Helper function to get a service by name
export function getService(serviceName: string): BaseService | undefined {
    return serviceRegistry.get(serviceName);
}

// Initialize all services
export async function initializeAllServices(): Promise<void> {
    const promises = Array.from(serviceRegistry.values()).map((service) =>
        service.initialize()
    );
    await Promise.all(promises);
    console.debug("All services initialized");
}
