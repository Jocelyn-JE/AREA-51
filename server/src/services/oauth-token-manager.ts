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
            if (serviceName === "google" && tokenData.refreshToken)
                return await this.refreshGoogleToken(tokenData);
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
            throw new Error("Failed to refresh Google access token");
        }
    }
}

export const oauthTokenManager = OAuthTokenManager.getInstance();
