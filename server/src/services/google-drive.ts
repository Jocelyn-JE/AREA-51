import { drive_v3, google } from "googleapis";
import {
    BaseService,
    Action,
    Reaction,
    ServiceExecutionContext
} from "./types";

export class GoogleDriveService extends BaseService {
    // in-memory timestamp of last check; stored per-service instance
    private lastCheck?: Date;
    constructor() {
        const actions: Action[] = [
            {
                name: "new_file",
                description: "Triggered when a new file is added",
                parameters: [
                    {
                        name: "folder_id",
                        type: "string",
                        description: "Specific folder to monitor (optional)",
                        required: false
                    },
                    {
                        name: "file_type",
                        type: "select",
                        description: "File type to monitor",
                        required: false,
                        options: [
                            "application/vnd.google-apps.document", // Google Docs
                            "application/vnd.google-apps.spreadsheet", // Google Sheets
                            "application/vnd.google-apps.presentation", // Google Slides
                            "image/*",
                            "video/*",
                            "text/plain",
                            "*/*" // any
                        ]
                    }
                ],
                execute: async (params, context) => {
                    return this.checkNewFiles(params, context);
                }
            },
            {
                name: "file_modified",
                description: "Triggered when a file is modified",
                parameters: [
                    {
                        name: "file_id",
                        type: "string",
                        description: "Specific file to monitor",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    return this.checkFileModified(params, context);
                }
            },
            {
                name: "file_shared",
                description: "Triggered when a file is shared",
                parameters: [
                    {
                        name: "folder_id",
                        type: "string",
                        description:
                            "Folder to monitor for shared files (optional)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    return this.checkFileShared(params, context);
                }
            }
        ];

        const reactions: Reaction[] = [
            {
                name: "create_file",
                description: "Create a new file",
                parameters: [
                    {
                        name: "name",
                        type: "string",
                        description: "File name",
                        required: true
                    },
                    {
                        name: "content",
                        type: "string",
                        description: "File content",
                        required: false
                    },
                    {
                        name: "folder_id",
                        type: "string",
                        description:
                            "Parent folder ID (auto-filled from trigger data if not provided)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    // Auto-fill folder_id from trigger data if available
                    const folderId =
                        (params.folder_id as string) ||
                        (params.triggerData as { parents?: string[] })
                            ?.parents?.[0];

                    await this.createFile(
                        params.name as string,
                        (params.content as string) || "",
                        folderId,
                        context
                    );
                }
            },
            {
                name: "upload_file",
                description: "Upload a file to Drive",
                parameters: [
                    {
                        name: "filename",
                        type: "string",
                        description: "Name of the file",
                        required: true
                    },
                    {
                        name: "content",
                        type: "string",
                        description: "File content or URL",
                        required: true
                    },
                    {
                        name: "mime_type",
                        type: "string",
                        description: "MIME type of the file",
                        required: true
                    }
                ],
                execute: async (params, context) => {
                    await this.uploadFile(
                        params.filename as string,
                        Buffer.from(params.content as string),
                        params.mime_type as string,
                        context
                    );
                }
            },
            {
                name: "share_file",
                description: "Share a file with someone",
                parameters: [
                    {
                        name: "file_id",
                        type: "string",
                        description:
                            "ID of the file to share (auto-filled from trigger data if not provided)",
                        required: false
                    },
                    {
                        name: "email",
                        type: "email",
                        description: "Email address to share with",
                        required: true
                    },
                    {
                        name: "role",
                        type: "select",
                        description: "Permission level",
                        required: false,
                        options: ["reader", "writer", "commenter", "owner"],
                        defaultValue: "reader"
                    }
                ],
                execute: async (params, context) => {
                    const file_id =
                        (params.file_id as string) ||
                        (params.triggerData as drive_v3.Schema$File)?.id;
                    if (!file_id) throw new Error("File ID is required");
                    const email =
                        (params.email as string) ||
                        (params.triggerData as { from?: string }).from;
                    if (!email) throw new Error("Email is required");
                    await this.shareFile(
                        file_id,
                        email,
                        (params.role as string) || "reader",
                        context
                    );
                }
            },
            {
                name: "copy_file",
                description: "Create a copy of a file",
                parameters: [
                    {
                        name: "file_id",
                        type: "string",
                        description:
                            "ID of the file to copy (auto-filled from trigger data if not provided)",
                        required: false
                    },
                    {
                        name: "new_name",
                        type: "string",
                        description:
                            "Name for the copied file (optional, defaults to 'Copy of {original_name}')",
                        required: false
                    },
                    {
                        name: "folder_id",
                        type: "string",
                        description:
                            "Destination folder ID (auto-filled from trigger data if not provided)",
                        required: false
                    }
                ],
                execute: async (params, context) => {
                    const fileId =
                        (params.file_id as string) ||
                        (params.triggerData as drive_v3.Schema$File)?.id;
                    if (!fileId) throw new Error("File ID is required");

                    const folderId =
                        (params.folder_id as string) ||
                        (params.triggerData as { parents?: string[] })
                            ?.parents?.[0];

                    await this.copyFile(
                        fileId,
                        params.new_name as string,
                        folderId,
                        context
                    );
                }
            }
        ];

        super("Google Drive", actions, reactions);
    }

    async initialize(): Promise<void> {
        // Initialize Google Drive API connection
        console.log(`${this.name} service initialized`);
    }

    // Helper method to create authenticated Drive client (v3)
    private getAuthenticatedDriveClient(accessToken: string) {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        return google.drive({ version: "v3", auth });
    }

    // Action implementations (trigger checks)
    private async checkNewFiles(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown | null> {
        console.log(`Checking for new files with params:`, params);
        if (!context || !context.userTokens.google) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error("Google OAuth token required to check files");
        }
        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        ); // Create client with user's token

        // Optional filters
        const folderId = params["folder_id"] as string | undefined;
        const fileType = params["file_type"] as string | undefined;
        const since = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

        // Build Drive query
        const qParts: string[] = [];
        // Folder filter
        if (folderId) qParts.push(`'${folderId}' in parents`);
        // File type / mime type filter
        if (fileType) {
            // support wildcard like image/* -> use contains
            if (fileType.includes("*")) {
                const prefix = fileType.split("/")[0];
                qParts.push(`mimeType contains '${prefix}/'`);
            } else {
                qParts.push(`mimeType = '${fileType}'`);
            }
        }
        // createdTime filter (v3 uses createdTime)
        qParts.push(`createdTime > '${since.toISOString()}'`);
        const q = qParts.join(" and ");
        try {
            const res = await drive.files.list({
                q,
                fields: "files(id,name,mimeType,createdTime)",
                orderBy: "createdTime desc",
                pageSize: 50
            });

            const files = res.data.files || [];

            // update lastCheck so next poll doesn't report the same files
            this.lastCheck = new Date();

            if (files.length > 0) {
                console.log(
                    `Found ${files.length} new file(s):`,
                    files.map((f) => ({
                        id: f.id,
                        name: f.name,
                        createdTime: f.createdTime
                    }))
                );
                return files; // this return is the triggerData fetched by the area engine
            }

            console.log("No new files found");
            return null;
        } catch (err) {
            console.error("Error checking Drive for new files", err);
            // Do not advance lastCheck on error so we retry the same window next time
            return null;
        }
    }

    private async checkFileModified(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<unknown | null> {
        console.log(`Checking for file modifications:`, params);
        if (!context || !context.userTokens.google) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error("Google OAuth token required to check files");
        }
        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        ); // Create client with user's token
        const fileId = params["file_id"] as string;
        if (!fileId) throw new Error("file_id parameter is required");
        try {
            const res = await drive.files.get({
                fileId,
                fields: "id,name,modifiedTime"
            });
            const file = res.data;
            if (!file || !file.modifiedTime) {
                console.log(`File ${fileId} not found or has no modifiedTime`);
                return null;
            }
            const modifiedTime = new Date(file.modifiedTime);
            // If lastCheck is not set, initialize it to now and do not trigger
            if (!this.lastCheck) {
                this.lastCheck = new Date();
                console.log(
                    `Initialized lastCheck to now; not triggering on first run`
                );
                return null;
            }
            if (modifiedTime > this.lastCheck) {
                console.log(`File ${fileId} was modified after lastCheck`);
                this.lastCheck = modifiedTime;
                return file;
            }
            return null;
        } catch (err) {
            console.error("Error checking file modified time", err);
            return null;
        }
    }

    private async checkFileShared(
        params: Record<string, unknown>,
        context?: ServiceExecutionContext
    ): Promise<boolean> {
        console.log(`Checking for shared files:`, params);
        if (!context || !context.userTokens.google) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error("Google OAuth token required to check files");
        }
        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        ); // Create client with user's token
        const fileId = params["file_id"] as string;
        if (!fileId) throw new Error("file_id parameter is required");
        try {
            // Fetch file metadata to get owners and permissions
            const res = await drive.files.get({
                fileId,
                fields: "owners, permissions"
            });
            const permissions = res.data.permissions || [];
            const owners = res.data.owners || [];
            const ownerEmails = owners.map((o) => o.emailAddress).filter(Boolean);
            const isShared = permissions.some(
                (p) =>
                    (p.type === "user" || p.type === "group") &&
                    p.role !== "owner" &&
                    p.emailAddress &&
                    !ownerEmails.includes(p.emailAddress)
            );
            console.log(`File ${fileId} is shared: ${isShared}`);
            return isShared;
        } catch (err) {
            console.error("Error checking file shared status", err);
            return false;
        }
    }

    // Reaction implementations
    async createFile(
        name: string,
        content: string,
        folderId?: string,
        context?: ServiceExecutionContext
    ): Promise<string> {
        console.log(`Creating file ${name} in folder ${folderId || "root"}`);
        if (!context || !context.userTokens.google)
            throw new Error("Google OAuth token required to create files");
        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        );
        try {
            const fileMetadata: drive_v3.Schema$File = {
                name: name,
                parents: folderId ? [folderId] : undefined
            };

            const media = {
                mimeType: "text/plain",
                body: content
            };

            const res = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: "id,name,webViewLink"
            });

            const fileId = res.data.id;
            if (!fileId)
                throw new Error("Failed to create file: No file ID returned");

            console.log(
                `File created successfully: ${res.data.name} (ID: ${fileId})`
            );
            console.log(`View link: ${res.data.webViewLink}`);
            return fileId;
        } catch (err: unknown) {
            const apiErr = err as {
                response?: { data?: { error?: { message?: string } } };
            };
            if (apiErr.response && apiErr.response.data) {
                console.error(
                    "Drive API error while creating file:",
                    apiErr.response.data
                );
                const msg =
                    apiErr.response.data.error?.message ||
                    JSON.stringify(apiErr.response.data);
                throw new Error(`Failed to create file: ${msg}`);
            }
            console.error("Unknown error while creating file", err);
            throw err;
        }
    }

    // Google Drive-specific methods
    async uploadFile(
        filename: string,
        content: Buffer,
        mimeType: string,
        context?: ServiceExecutionContext
    ): Promise<string> {
        console.log(`Uploading file ${filename} with mime type ${mimeType}`);
        if (!context || !context.userTokens.google) {
            throw new Error("Google OAuth token required to upload files");
        }

        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        );

        try {
            const fileMetadata: drive_v3.Schema$File = {
                name: filename
            };

            const media = {
                mimeType: mimeType,
                body: content
            };

            const res = await drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: "id,name,webViewLink,size"
            });

            const fileId = res.data.id;
            if (!fileId) {
                throw new Error("Failed to upload file: No file ID returned");
            }

            console.log(
                `File uploaded successfully: ${res.data.name} (ID: ${fileId})`
            );
            console.log(
                `Size: ${res.data.size} bytes, View link: ${res.data.webViewLink}`
            );

            return fileId;
        } catch (err: unknown) {
            const apiErr = err as {
                response?: { data?: { error?: { message?: string } } };
            };
            if (apiErr.response && apiErr.response.data) {
                console.error(
                    "Drive API error while uploading file:",
                    apiErr.response.data
                );
                const msg =
                    apiErr.response.data.error?.message ||
                    JSON.stringify(apiErr.response.data);
                throw new Error(`Failed to upload file: ${msg}`);
            }
            console.error("Unknown error while uploading file", err);
            throw err;
        }
    }

    async shareFile(
        fileId: string,
        email: string,
        role: string,
        context?: ServiceExecutionContext
    ): Promise<void> {
        console.log(`Sharing file ${fileId} with ${email} as ${role}`);
        if (!["reader", "writer", "commenter", "owner"].includes(role))
            throw new Error(`Invalid role: ${role}`);
        if (!email) throw new Error("Email is required");
        if (!context || !context.userTokens.google) {
            if (!context) console.error("No context provided");
            console.debug(context);
            throw new Error("Google OAuth token required to share files");
        }
        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        );
        try {
            const requestBody: drive_v3.Schema$Permission = {
                role: role as drive_v3.Schema$Permission["role"],
                type: "user",
                emailAddress: email
            } as drive_v3.Schema$Permission;

            const res = await drive.permissions.create({
                fileId,
                requestBody,
                // When transferring ownership set this to true. This requires
                // the caller to have the right to transfer ownership and may be
                // restricted by domain policies.
                transferOwnership: role === "owner",
                // Ask Google to send a notification to the recipient
                sendNotificationEmail: true,
                fields: "id,role"
            });

            console.log(
                `Permission created for ${email} on file ${fileId}:`,
                res.data
            );
        } catch (err: unknown) {
            // Provide more actionable error messages for common cases
            const apiErr = err as {
                response?: { data?: { error?: { message?: string } } };
            };
            if (apiErr.response && apiErr.response.data) {
                console.error(
                    "Drive API error while creating permission:",
                    apiErr.response.data
                );
                // Bubble up a clearer message
                const msg =
                    apiErr.response.data.error?.message ||
                    JSON.stringify(apiErr.response.data);
                throw new Error(`Failed to share file: ${msg}`);
            }
            console.error("Unknown error while sharing file", err);
            throw err;
        }
    }

    async copyFile(
        fileId: string,
        newName?: string,
        folderId?: string,
        context?: ServiceExecutionContext
    ): Promise<string> {
        console.log(`Copying file ${fileId} to ${folderId || "root"}`);
        if (!context || !context.userTokens.google) {
            throw new Error("Google OAuth token required to copy files");
        }

        const drive = this.getAuthenticatedDriveClient(
            context.userTokens.google
        );

        try {
            // First get the original file name if new name not provided
            let copyName = newName;
            if (!copyName) {
                const originalFile = await drive.files.get({
                    fileId,
                    fields: "name"
                });
                copyName = `Copy of ${originalFile.data.name}`;
            }

            const copyMetadata: drive_v3.Schema$File = {
                name: copyName,
                parents: folderId ? [folderId] : undefined
            };

            const res = await drive.files.copy({
                fileId,
                requestBody: copyMetadata,
                fields: "id,name,webViewLink"
            });

            const newFileId = res.data.id;
            if (!newFileId) {
                throw new Error("Failed to copy file: No file ID returned");
            }

            console.log(
                `File copied successfully: ${res.data.name} (ID: ${newFileId})`
            );
            console.log(`View link: ${res.data.webViewLink}`);

            return newFileId;
        } catch (err: unknown) {
            const apiErr = err as {
                response?: { data?: { error?: { message?: string } } };
            };
            if (apiErr.response && apiErr.response.data) {
                console.error(
                    "Drive API error while copying file:",
                    apiErr.response.data
                );
                const msg =
                    apiErr.response.data.error?.message ||
                    JSON.stringify(apiErr.response.data);
                throw new Error(`Failed to copy file: ${msg}`);
            }
            console.error("Unknown error while copying file", err);
            throw err;
        }
    }
}
