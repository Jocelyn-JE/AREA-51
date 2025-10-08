// Test the new data-returning action functionality
import { initializeAllServices } from "../src/services";
import { areaEngine } from "../src/services/area-engine";

async function testDataActions() {
    console.log("🧪 Testing data-returning actions...\n");

    await initializeAllServices();

    // Test Gmail action that returns email data
    console.log("📧 Testing Gmail new_email action:");

    // Test without filters - should return mock email
    const result1 = await areaEngine.testAction("gmail", "new_email", {});
    console.log("Without filters:", result1);

    // Test with from_filter
    const result2 = await areaEngine.testAction("gmail", "new_email", {
        from_filter: "boss@company.com"
    });
    console.log("With from_filter:", result2);

    // Test with subject filter
    const result3 = await areaEngine.testAction("gmail", "new_email", {
        subject_contains: "urgent"
    });
    console.log("With subject filter:", result3);

    // Test both filters
    const result4 = await areaEngine.testAction("gmail", "new_email", {
        from_filter: "boss@company.com",
        subject_contains: "meeting"
    });
    console.log("With both filters:", result4);

    console.log("\n🔗 Testing action→reaction data flow:");

    // Simulate an area execution where action data flows to reaction
    const mockEmailData = {
        threadId: "thread_xyz789",
        from: "colleague@example.com",
        subject: "Project Update"
    };

    console.log("Mock email data:", mockEmailData);

    // Test reply using the thread ID from action data
    await areaEngine.executeReaction("gmail", "reply_to_email", {
        thread_id: mockEmailData.threadId,
        body: "Thanks for the update!",
        triggerData: mockEmailData
    });

    console.log("\n✅ Data-returning actions test completed!");
}

if (require.main === module) {
    testDataActions().catch(console.error);
}

export { testDataActions };
