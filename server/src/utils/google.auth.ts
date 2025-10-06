import { OAuth2Client } from "google-auth-library";

export const CLIENT_ID =
    "210212748639-u6rbif83ca1uqkijrpc3iak87ajahrpd.apps.googleusercontent.com";
export const googleClient = new OAuth2Client(CLIENT_ID);
export const API_KEY = process.env.GOOGLE_API_KEY;

export async function verifyGoogleToken(token: string) {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    return ticket.getPayload();
}

export default googleClient;
