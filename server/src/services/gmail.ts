import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext
} from "./types";
import { google } from "googleapis";

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
                execute: async (params, context) => {
                    return this.checkNewEmails(params, context);
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
                execute: async (params, context) => {
                    await this.sendMail(
                        params.to as string,
                        params.subject as string,
                        params.body as string,
                        context
                    );
                }
            },
            {
                name: "reply_to_email",
                description: "Reply to an email in a specific thread",
                parameters: [
                    {
                        name: "thread_id",
                        type: "string",
                        description:
                            "Thread ID to reply to (auto-filled from trigger data if not provided)",
                        required: false
                    },
                    {
                        name: "body",
                        type: "string",
                        description: "Reply message body",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    // Get thread_id from params or trigger data
                    const threadId =
                        (params.thread_id as string) ||
                        (params.triggerData as { threadId?: string })?.threadId;
                    if (!threadId) {
                        throw new Error(
                            "thread_id must be provided either as parameter or from trigger data"
                        );
                    }
                    await this.replyToEmail(
                        threadId,
                        params.body as string,
                        context
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

    // Helper method to create authenticated Gmail client
    private getAuthenticatedGmailClient(accessToken: string) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        return google.gmail({ version: "v1", auth });
    }

    // Action implementations (trigger checks)
    private async checkNewEmails(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown> {
        console.log(`Checking for new emails with filters:`, params);
        // Check if user has Google OAuth token
        if (!context || !context.userTokens.google)
            throw new Error("Google OAuth token required to check emails");
        try {
            // Create authenticated Gmail client
            const gmail = this.getAuthenticatedGmailClient(
                context.userTokens.google
            );

            // Get recent messages from inbox
            const messagesResponse = await gmail.users.messages.list({
                userId: "me",
                labelIds: ["INBOX"],
                maxResults: 10
            });
            const messages = messagesResponse.data.messages;
            if (!messages || messages.length === 0) return null; // No new emails
            // Get details of the most recent email
            const latestMessage = messages[0];
            if (!latestMessage.id) return null; // Message has no ID
            const messageResponse = await gmail.users.messages.get({
                userId: "me",
                id: latestMessage.id
            });

            const messageData = messageResponse.data;
            // Extract email data from headers
            const headers = messageData.payload?.headers || [];
            const fromHeader =
                headers.find((h) => h.name === "From")?.value || "";
            const subjectHeader =
                headers.find((h) => h.name === "Subject")?.value || "";

            // Apply filters if provided
            if (params.from_filter) {
                const fromFilter = params.from_filter as string;
                if (!fromHeader.includes(fromFilter)) return null; // No match
            }
            if (params.subject_contains) {
                const subjectFilter = params.subject_contains as string;
                if (!subjectHeader.includes(subjectFilter)) return null; // No match
            }
            // Return email data if filters match
            return {
                threadId: messageData.threadId,
                messageId: messageData.id,
                from: fromHeader,
                subject: subjectHeader,
                timestamp: messageData.internalDate
                    ? new Date(parseInt(messageData.internalDate)).toISOString()
                    : new Date().toISOString(),
                snippet: messageData.snippet
            };
        } catch (error) {
            console.error("Error checking Gmail:", error);
            return null; // Don't trigger on API errors
        }
    }

    // Reaction implementations (actual actions)
    async sendMail(
        to: string,
        subject: string,
        body: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        // Check if user has Google OAuth token
        if (!context || !context.userTokens.google)
            throw new Error("Google OAuth token required to send emails");
        try {
            const gmail = this.getAuthenticatedGmailClient(
                context.userTokens.google
            ); // Create authenticated Gmail client
            const email = [`To: ${to}`, `Subject: ${subject}`, "", body].join(
                "\n"
            ); // Create email message
            const encodedEmail = Buffer.from(email) // Encode email as base64url
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");
            // Send email
            await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: encodedEmail
                }
            });
            console.log(
                `Email sent successfully from ${context.userId} to ${to}`
            );
        } catch (error) {
            console.error("Error sending email:", error);
            throw new Error("Failed to send email");
        }
    }

    async replyToEmail(
        threadId: string,
        body: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        // Check if user has Google OAuth token
        if (!context || !context.userTokens.google)
            throw new Error("Google OAuth token required to reply to emails");
        try {
            const gmail = this.getAuthenticatedGmailClient(
                context.userTokens.google
            ); // Create authenticated Gmail client
            const thread = await gmail.users.threads.get({
                userId: "me",
                id: threadId
            }); // Get the original thread to extract reply-to information
            if (!thread.data.messages || thread.data.messages.length === 0)
                throw new Error("Thread not found or empty");
            const originalMessage = thread.data.messages[0]; // Get the first message to extract headers
            const headers = originalMessage.payload?.headers || [];
            const toHeader =
                headers.find((h) => h.name === "From")?.value || "";
            const subjectHeader =
                headers.find((h) => h.name === "Subject")?.value || "";
            const replySubject = subjectHeader.startsWith("Re:")
                ? subjectHeader
                : `Re: ${subjectHeader}`;
            const email = [
                `To: ${toHeader}`,
                `Subject: ${replySubject}`,
                `In-Reply-To: ${originalMessage.id}`,
                `References: ${originalMessage.id}`,
                "",
                body
            ].join("\n"); // Create reply message
            const encodedEmail = Buffer.from(email) // Encode email as base64url
                .toString("base64")
                .replace(/\+/g, "-")
                .replace(/\//g, "_")
                .replace(/=+$/, "");
            await gmail.users.messages.send({
                userId: "me",
                requestBody: {
                    raw: encodedEmail,
                    threadId: threadId
                }
            }); // Send reply
            console.log(
                `Reply sent successfully from ${context.userId} to thread ${threadId}`
            );
        } catch (error) {
            console.error("Error replying to email:", error);
            throw new Error("Failed to reply to email");
        }
    }
}
