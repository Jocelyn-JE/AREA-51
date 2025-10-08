import { OAuth2Client } from "google-auth-library";
import { ObjectId } from "mongodb";

export const CLIENT_ID =
    "210212748639-u6rbif83ca1uqkijrpc3iak87ajahrpd.apps.googleusercontent.com";
export const oauth2Client = new OAuth2Client(
    CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);
export const API_KEY = process.env.GOOGLE_API_KEY;

export async function verifyGoogleToken(token: string) {
    const ticket = await oauth2Client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    return ticket.getPayload();
}

export type OAuthToken = {
    userId: ObjectId;
    serviceName: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scopes: string[];
    createdAt: Date;
    updatedAt: Date;
};

export default oauth2Client;
