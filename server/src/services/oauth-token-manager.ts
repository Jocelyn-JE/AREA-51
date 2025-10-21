import { db } from "../mongodb";
import { ObjectId } from "mongodb";
import { OAuthToken, oauth2Client } from "../utils/google.auth";

// Singleton class to manage OAuth tokens
export class OAuthTokenManager {
    private static instance: OAuthTokenManager;

    static getInstance(): OAuthTokenManager {
        if (!OAuthTokenManager.instance)
            OAuthTokenManager.instance = new OAuthTokenManager();
        return OAuthTokenManager.instance;
    }

    async getTokensForUser(
        userId: ObjectId,
        serviceName: string
    ): Promise<OAuthToken | null> {
        return await db.collection<OAuthToken>("oauth_tokens").findOne({
            userId,
            serviceName
        });
    }

    async getAllTokensForUser(
        userId: ObjectId
    ): Promise<Record<string, string>> {
        const tokens = await db
            .collection<OAuthToken>("oauth_tokens")
            .find({ userId })
            .toArray();
        const tokenMap: Record<string, string> = {};
        for (const token of tokens) {
            // Refresh token if needed and get fresh access token
            const freshToken = await this.refreshTokenIfNeeded(
                userId,
                token.serviceName
            );
            if (freshToken) tokenMap[token.serviceName] = freshToken;
        }
        return tokenMap;
    }

    async storeTokens(
        tokens: Omit<OAuthToken, "_id" | "createdAt" | "updatedAt">
    ): Promise<void> {
        const now = new Date();
        await db.collection<OAuthToken>("oauth_tokens").updateOne(
            { userId: tokens.userId, serviceName: tokens.serviceName },
            {
                $set: {
                    ...tokens,
                    updatedAt: now
                },
                $setOnInsert: {
                    createdAt: now
                }
            },
            { upsert: true }
        );
    }

    async removeTokensForUser(
        userId: ObjectId,
        serviceName: string
    ): Promise<void> {
        await db.collection<OAuthToken>("oauth_tokens").deleteOne({
            userId,
            serviceName
        });
    }

    async refreshTokenIfNeeded(
        userId: ObjectId,
        serviceName: string
    ): Promise<string | null> {
        const tokenData = await this.getTokensForUser(userId, serviceName);
        if (!tokenData) return null;
        // Check if token is expired (with 5 min buffer)
        if (
            tokenData.expiresAt &&
            tokenData.expiresAt < new Date(Date.now() + 5 * 60 * 1000)
        ) {
            if (serviceName === "google" && tokenData.refreshToken) {
                try {
                    return await this.refreshGoogleToken(tokenData);
                } catch (error) {
                    // If refresh fails due to invalid grant, remove the tokens
                    if (
                        error instanceof Error &&
                        error.message.includes("invalid_grant")
                    ) {
                        console.log(
                            `Removing expired Google tokens for user ${userId}`
                        );
                        await this.removeTokensForUser(userId, serviceName);
                        return null;
                    }
                    throw error;
                }
            }
            // Add other service refresh logic here when implemented
        }

        return tokenData.accessToken;
    }

    private async refreshGoogleToken(tokenData: OAuthToken): Promise<string> {
        try {
            // Set the refresh token
            oauth2Client.setCredentials({
                refresh_token: tokenData.refreshToken
            });
            // Get fresh access token
            const { credentials } = await oauth2Client.refreshAccessToken();
            if (!credentials.access_token)
                throw new Error("Failed to refresh Google access token");
            // Update stored tokens
            await this.storeTokens({
                userId: tokenData.userId,
                serviceName: "google",
                accessToken: credentials.access_token,
                refreshToken:
                    credentials.refresh_token || tokenData.refreshToken,
                expiresAt: credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : undefined,
                scopes: tokenData.scopes
            });
            return credentials.access_token;
        } catch (error) {
            console.error("Error refreshing Google token:", error);

            // Check if this is an invalid_grant error (expired/revoked refresh token)
            const errorMessage =
                error instanceof Error ? error.message : String(error);
            const errorCode =
                typeof error === "object" && error !== null && "code" in error
                    ? error.code
                    : null;
            const errorResponse =
                typeof error === "object" &&
                error !== null &&
                "response" in error &&
                typeof error.response === "object" &&
                error.response !== null &&
                "data" in error.response &&
                typeof error.response.data === "object" &&
                error.response.data !== null &&
                "error" in error.response.data
                    ? error.response.data.error
                    : null;

            if (
                errorResponse === "invalid_grant" ||
                errorMessage.includes("invalid_grant") ||
                errorCode === 400
            ) {
                throw new Error("invalid_grant");
            }

            throw new Error(
                `Failed to refresh Google access token: ${errorMessage}`
            );
        }
    }
}

export const oauthTokenManager = OAuthTokenManager.getInstance();
