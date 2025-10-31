import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext
} from "./types";

type GraphMessage = {
    id?: string;
    subject?: string;
    bodyPreview?: string;
    from?: { emailAddress?: { name?: string; address?: string } };
    receivedDateTime?: string;
    webLink?: string;
};

type GraphEvent = {
    id?: string;
    subject?: string;
    start?: { dateTime?: string; timeZone?: string };
    end?: { dateTime?: string; timeZone?: string };
    bodyPreview?: string;
    organizer?: { emailAddress?: { name?: string; address?: string } };
    webLink?: string;
};

function graphFetch(
    accessToken: string,
    path: string,
    init: RequestInit = {}
): Promise<Response> {
    const url = `https://graph.microsoft.com/v1.0${path}`;
    return fetch(url, {
        ...init,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(init.headers || {})
        }
    });
}

export class OutlookService extends BaseService {
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
            },
            {
                name: "new_calendar_event",
                description: "Triggered when a new calendar event starts",
                parameters: [
                    {
                        name: "calendar_id",
                        type: "string",
                        description:
                            "Calendar id (optional, defaults to primary)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    return this.checkNewCalendarEvents(params, context);
                }
            }
        ];

        const reactions: Reaction[] = [
            {
                name: "send_email",
                description: "Send an email using Microsoft Graph",
                parameters: [
                    {
                        name: "to",
                        type: "email",
                        description: "Recipient email",
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
                        description: "Email body (HTML or plain)",
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
                description:
                    "Reply to an email using Microsoft Graph (uses original recipients)",
                parameters: [
                    {
                        name: "message_id",
                        type: "string",
                        description:
                            "Message ID to reply to (optional if trigger data provides it)",
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
                    const messageId =
                        (params.message_id as string) ||
                        (params.triggerData as { messageId?: string })
                            ?.messageId;
                    if (!messageId) {
                        throw new Error(
                            "message_id must be provided either as parameter or from trigger data"
                        );
                    }
                    await this.replyToEmail(
                        messageId,
                        params.body as string,
                        context
                    );
                }
            }
        ];

        super("Outlook", actions, reactions);
    }

    async initialize(): Promise<void> {
        console.log(`${this.name} service initialized`);
    }

    // Action: check for new emails
    private async checkNewEmails(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<GraphMessage | null> {
        console.log("Checking Outlook for new emails with params:", params);
        if (!context || !context.userTokens?.microsoft) {
            console.error("Microsoft context or token missing", context);
            throw new Error("Microsoft OAuth token required to check emails");
        }
        const accessToken = context.userTokens.microsoft as string;
        // Determine lastChecked or default window
        const lastChecked = params.lastTriggered
            ? new Date(params.lastTriggered as string)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const iso = lastChecked.toISOString();

        try {
            // Use messages endpoint with $filter on receivedDateTime
            const filter = `receivedDateTime ge ${iso}`;
            const path = `/me/messages?$filter=${encodeURIComponent(
                filter
            )}&$orderby=receivedDateTime desc&$top=10`;

            const res = await graphFetch(accessToken, path);
            const data = (await res.json().catch(() => null)) as {
                value?: GraphMessage[];
            };

            if (!res.ok) {
                console.error("Graph API error checking messages:", data);
                return null;
            }
            if (!data || !data.value) {
                console.log("No new Outlook messages found");
                return null;
            }
            const items: GraphMessage[] = data.value;
            if (!Array.isArray(items)) {
                console.log("No new Outlook messages found");
                return null;
            }
            if (!items.length || items.length === 0) {
                console.log("No new Outlook messages found");
                return null;
            }
            const latest = items[0];
            // Apply optional filters
            if (params.from_filter) {
                const fromFilter = params.from_filter as string;
                const fromAddr = latest.from?.emailAddress?.address || "";
                if (!fromAddr.includes(fromFilter)) return null;
            }
            if (params.subject_contains) {
                const subjFilter = params.subject_contains as string;
                if (!(latest.subject || "").includes(subjFilter)) return null;
            }
            return {
                id: latest.id,
                subject: latest.subject,
                bodyPreview: latest.bodyPreview,
                from: latest.from,
                receivedDateTime: latest.receivedDateTime,
                webLink: latest.webLink
            };
        } catch (err) {
            console.error("Error checking Outlook messages:", err);
            return null;
        }
    }

    // Action: check for new calendar events starting after lastTriggered
    private async checkNewCalendarEvents(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<GraphEvent | null> {
        console.log("Checking Outlook calendar with params:", params);
        if (!context || !context.userTokens?.microsoft) {
            console.error("Microsoft context or token missing", context);
            throw new Error("Microsoft OAuth token required to check calendar");
        }
        const accessToken = context.userTokens.microsoft as string;
        const lastChecked = params.lastTriggered
            ? new Date(params.lastTriggered as string)
            : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const start = lastChecked.toISOString();
        const end = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(); // look ahead 7 days

        try {
            // Use calendarView to list events in a window
            const path = `/me/calendarView?startDateTime=${encodeURIComponent(
                start
            )}&endDateTime=${encodeURIComponent(end)}&$orderby=start/dateTime desc&$top=10`;
            const res = await graphFetch(accessToken, path);
            const data = (await res.json().catch(() => null)) as {
                value?: GraphEvent[];
            };

            if (!res.ok) {
                console.error("Graph API error checking calendar:", data);
                return null;
            }
            if (!data || !data.value) {
                console.log("No new calendar events found");
                return null;
            }
            const items: GraphEvent[] = data.value || [];
            if (!items.length) {
                console.log("No new calendar events found");
                return null;
            }
            // Return the earliest event after lastChecked (or most recent depending on ordering)
            const latest = items[0];
            return {
                id: latest.id,
                subject: latest.subject,
                start: latest.start,
                end: latest.end,
                bodyPreview: latest.bodyPreview,
                organizer: latest.organizer,
                webLink: latest.webLink
            };
        } catch (err) {
            console.error("Error checking Outlook calendar:", err);
            return null;
        }
    }

    // Reaction: send email via Graph
    async sendMail(
        to: string,
        subject: string,
        body: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        console.log(`Sending Outlook email to ${to}`);
        if (!context || !context.userTokens?.microsoft)
            throw new Error("Microsoft OAuth token required to send email");
        const accessToken = context.userTokens.microsoft as string;

        const message = {
            message: {
                subject,
                body: { contentType: "HTML", content: body },
                toRecipients: [{ emailAddress: { address: to } }]
            },
            saveToSentItems: true
        };

        try {
            const res = await graphFetch(accessToken, `/me/sendMail`, {
                method: "POST",
                body: JSON.stringify(message)
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                console.error("Graph API error sending mail:", data);
                throw new Error("Failed to send Outlook email");
            }
            console.log("Outlook email sent");
        } catch (err) {
            console.error("Error sending Outlook email:", err);
            throw err;
        }
    }

    // Reaction: reply to an email
    async replyToEmail(
        messageId: string,
        body: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        console.log(`Replying to Outlook message ${messageId}`);
        if (!context || !context.userTokens?.microsoft)
            throw new Error("Microsoft OAuth token required to reply to email");
        const accessToken = context.userTokens.microsoft as string;

        try {
            const res = await graphFetch(
                accessToken,
                `/me/messages/${encodeURIComponent(messageId)}/reply`,
                {
                    method: "POST",
                    body: JSON.stringify({ comment: body })
                }
            );
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                console.error("Graph API error replying to message:", data);
                throw new Error("Failed to reply to Outlook message");
            }
            console.log("Outlook reply sent");
        } catch (err) {
            console.error("Error replying to Outlook message:", err);
            throw err;
        }
    }
}

export default OutlookService;
