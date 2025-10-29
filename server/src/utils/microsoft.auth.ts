export const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
export const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
export const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI;
// Optional tenant id (defaults to "common" so both personal and work accounts can sign in)
export const MICROSOFT_TENANT = process.env.MICROSOFT_TENANT || "common";

type MicrosoftUser = {
    id: string;
    displayName?: string;
    mail?: string | null;
    userPrincipalName?: string;
    jobTitle?: string | null;
    mobilePhone?: string | null;
    officeLocation?: string | null;
    preferredLanguage?: string | null;
};

type MicrosoftTokenResponse = {
    token_type?: string;
    scope?: string;
    expires_in?: number;
    ext_expires_in?: number;
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
};

/**
 * Build Microsoft OAuth2 authorization URL.
 * @param state optional state string
 * @param scopes array of scopes (defaults to ["User.Read"])
 */
export function getMicrosoftOAuthUrl(
    state?: string,
    scopes: string[] = ["User.Read"]
): string {
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_REDIRECT_URI)
        throw new Error("Microsoft OAuth configuration is missing");

    const params = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        response_type: "code",
        redirect_uri: MICROSOFT_REDIRECT_URI,
        response_mode: "query",
        scope: scopes.join(" "),
        ...(state && { state })
    });

    return `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token.
 * Returns the access_token string.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
    if (!MICROSOFT_CLIENT_ID || !MICROSOFT_REDIRECT_URI)
        throw new Error("Microsoft OAuth configuration is missing");

    const tokenUrl = `https://login.microsoftonline.com/${MICROSOFT_TENANT}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        scope: "User.Read", // common minimum; callers may request additional scopes in auth URL
        code,
        redirect_uri: MICROSOFT_REDIRECT_URI,
        grant_type: "authorization_code",
        ...(MICROSOFT_CLIENT_SECRET && {
            client_secret: MICROSOFT_CLIENT_SECRET
        })
    });

    try {
        const res = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString()
        });

        if (!res.ok)
            throw new Error(`Microsoft token endpoint error: ${res.status}`);
        const data = (await res.json()) as MicrosoftTokenResponse;
        if (data.error)
            throw new Error(
                `Microsoft OAuth error: ${data.error_description || data.error}`
            );
        if (!data.access_token)
            throw new Error("No access token received from Microsoft");
        return data.access_token;
    } catch (err) {
        throw new Error(`Failed to exchange code for token: ${err}`);
    }
}

/**
 * Verify an access token by calling Microsoft Graph /me endpoint.
 * Returns the user profile if token is valid.
 */
export async function verifyMicrosoftToken(
    accessToken: string
): Promise<MicrosoftUser> {
    try {
        const res = await fetch("https://graph.microsoft.com/v1.0/me", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json"
            }
        });

        if (!res.ok)
            throw new Error(`Microsoft Graph API error: ${res.status}`);
        const user = (await res.json()) as MicrosoftUser | undefined;
        if (!user) throw new Error("Failed to parse Microsoft user data");
        return user;
    } catch (err) {
        throw new Error(`Failed to verify Microsoft token: ${err}`);
    }
}
