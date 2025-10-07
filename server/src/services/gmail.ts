import { BaseService, Action, Reaction } from "./types";

export class GmailService extends BaseService {
    constructor() {
        const actions: Action[] = [
            {
                name: "new_email",
                description: "Triggered when a new email is received",
                parameters: [
                    {
                        name: "from_filter",
                        type: "email",
                        description:
                            "Only trigger for emails from this sender (optional)",
                        required: false
                    },
                    {
                        name: "subject_contains",
                        type: "string",
                        description:
                            "Only trigger if subject contains this text (optional)",
                        required: false
                    }
                ],
                execute: async (params) => {
                    return this.checkNewEmails(params);
                }
            }
        ];

        const reactions: Reaction[] = [
            {
                name: "send_email",
                description: "Send an email",
                parameters: [
                    {
                        name: "to",
                        type: "email",
                        description: "Recipient email address",
                        required: true
                    },
                    {
                        name: "subject",
                        type: "string",
                        description: "Email subject",
                        required: true
                    },
                    {
                        name: "body",
                        type: "string",
                        description: "Email body content",
                        required: true
                    }
                ],
                execute: async (params) => {
                    await this.sendMail(
                        params.to as string,
                        params.subject as string,
                        params.body as string
                    );
                }
            },
            {
                name: "reply_to_email",
                description: "Reply to an email",
                parameters: [
                    {
                        name: "thread_id",
                        type: "string",
                        description: "Thread ID to reply to",
                        required: true
                    },
                    {
                        name: "body",
                        type: "string",
                        description: "Reply content",
                        required: true
                    }
                ],
                execute: async (params) => {
                    await this.replyToEmail(
                        params.thread_id as string,
                        params.body as string
                    );
                }
            }
        ];

        super("Gmail", actions, reactions);
    }

    async initialize(): Promise<void> {
        // Initialize Gmail API connection, OAuth, etc.
        console.log(`${this.name} service initialized`);
    }

    // Action implementations (trigger checks)
    private async checkNewEmails(
        params: Record<string, unknown>
    ): Promise<unknown> {
        console.log(`Checking for new emails with filters:`, params);
        // Implementation would check Gmail API for new emails
        // Return email data if found, null if not

        // Mock email data for demonstration
        const mockEmail = {
            threadId: "thread_abc123",
            messageId: "msg_def456",
            from: "sender@example.com",
            to: "me@example.com",
            subject: "New Email Subject",
            body: "Email content here...",
            timestamp: new Date().toISOString(),
            labels: ["INBOX"]
        };

        // Apply filters if provided
        if (params.from_filter) {
            const fromFilter = params.from_filter as string;
            if (!mockEmail.from.includes(fromFilter)) {
                return null; // No match
            }
            mockEmail.from = fromFilter; // Use filtered sender
        }

        if (params.subject_contains) {
            const subjectFilter = params.subject_contains as string;
            if (!mockEmail.subject.includes(subjectFilter)) {
                return null; // No match
            }
            mockEmail.subject = `Email containing: ${subjectFilter}`;
        }

        return mockEmail; // Trigger fired with email data
    }

    // Reaction implementations (actual actions)
    async sendMail(to: string, subject: string, body: string): Promise<void> {
        // Implementation for sending email
        console.log(`Sending email to ${to} with subject: ${subject}`);
        console.log(`Body: ${body}`);
        // Add actual Gmail API call here
    }

    async replyToEmail(threadId: string, body: string): Promise<void> {
        // Implementation for replying to email
        console.log(`Replying to thread ${threadId}`);
        console.log(`Body: ${body}`);
        // Add actual Gmail API call here
    }

    async listEmails(maxResults = 10): Promise<unknown[]> {
        // Implementation for listing emails
        console.log(`Listing ${maxResults} emails`);
        // Add actual Gmail API call here
        return [];
    }

    async addLabel(emailId: string, label: string): Promise<void> {
        // Implementation for adding label
        console.log(`Adding label ${label} to email ${emailId}`);
        // Add actual Gmail API call here
    }
}
