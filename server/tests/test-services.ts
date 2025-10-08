// Simple test script to verify the new architecture
import { ObjectId } from "mongodb";
import { serviceRegistry, initializeAllServices } from "../src/services";
import { areaEngine, AreaExecution } from "../src/services/area-engine";

async function testServices() {
    console.log("🚀 Testing new service architecture...\n");

    // Initialize services
    await initializeAllServices();

    // List all available services
    console.log("📋 Available services:");
    for (const [name, service] of serviceRegistry) {
        console.log(
            `  - ${name}: ${service.actions.length} actions, ${service.reactions.length} reactions`
        );
    }

    // Test Gmail service
    const gmail = serviceRegistry.get("gmail");
    if (gmail) {
        console.log("\n📧 Testing Gmail service:");
        console.log(
            "Actions:",
            gmail.actionDefinitions.map((a) => a.name)
        );
        console.log(
            "Reactions:",
            gmail.reactionDefinitions.map((r) => r.name)
        );

        // Test a reaction
        try {
            await areaEngine.executeReaction("gmail", "send_email", {
                to: "test@example.com",
                subject: "Test Email",
                body: "This is a test email from the new architecture!"
            });
            console.log("✅ Gmail send_email reaction executed successfully");
        } catch (error) {
            console.log("❌ Gmail test failed:", error);
        }
    }

    // Test Google Drive service
    const drive = serviceRegistry.get("google-drive");
    if (drive) {
        console.log("\n📁 Testing Google Drive service:");
        console.log(
            "Actions:",
            drive.actionDefinitions.map((a) => a.name)
        );
        console.log(
            "Reactions:",
            drive.reactionDefinitions.map((r) => r.name)
        );

        // Test a reaction
        try {
            await areaEngine.executeReaction("google-drive", "create_file", {
                name: "test-document.txt",
                content: "Hello from the new AREA architecture!",
                folder_id: "root"
            });
            console.log(
                "✅ Google Drive create_file reaction executed successfully"
            );
        } catch (error) {
            console.log("❌ Google Drive test failed:", error);
        }
    }

    // Test area validation
    console.log("\n🔍 Testing area validation:");
    const testArea: AreaExecution = {
        actionServiceName: "gmail",
        actionName: "new_email",
        actionParameters: {
            from_filter: "boss@company.com"
        },
        reactionServiceName: "google-drive",
        reactionName: "create_file",
        reactionParameters: {
            name: "email-notification.txt",
            content: "Boss sent an email!"
        },
        userId: new ObjectId(),
        enabled: true,
        createdAt: new Date()
    };

    const validationErrors = await areaEngine.validateArea(testArea);
    if (validationErrors.length === 0) {
        console.log("✅ Area validation passed");
    } else {
        console.log("❌ Area validation failed:", validationErrors);
    }

    console.log("\n🎉 Service architecture test completed!");
}

// Run the test if this file is executed directly
if (require.main === module) {
    testServices().catch(console.error);
}

export { testServices };
