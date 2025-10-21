export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

type GithubUserData = {
    id: string;
    login: string;
    email: string;
    name: string;
    avatar_url: string;
};

/**
 * Verifies a GitHub access token.
 * @param accessToken The access token to verify.
 * @returns The user data if the token is valid, otherwise throws an error.
 */
export async function verifyGithubToken(accessToken: string) {
    try {
        const response = await fetch("https://api.github.com/user", {
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/vnd.github.v3+json",
                "User-Agent": "AREA-51-App"
            }
        });

        if (!response.ok)
            throw new Error(`GitHub API error: ${response.status}`);
        const userData = (await response.json()) as GithubUserData | undefined;
        if (!userData) throw new Error("Failed to parse GitHub user data");
        return userData;
    } catch (error) {
        throw new Error(`Failed to verify GitHub token: ${error}`);
    }
}

/**
 * Generates the GitHub OAuth URL for user authorization.
 * @param state Optional state parameter to maintain state between request and callback.
 * @returns The GitHub OAuth authorization URL.
 */
export function getGithubOAuthUrl(
    state?: string,
    scopes: string[] = []
): string {
    if (!GITHUB_CLIENT_ID || !GITHUB_REDIRECT_URI)
        throw new Error("GitHub OAuth configuration is missing");

    const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: GITHUB_REDIRECT_URI,
        scope: scopes.join(" "),
        ...(state && { state })
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

type GitHubTokenResponse = {
    access_token?: string;
    error?: string;
    error_description?: string;
};

/**
 * Exchanges a GitHub OAuth code for an access token.
 * @param code The OAuth code received from GitHub.
 * @returns The access token.
 */
export async function exchangeCodeForToken(code: string): Promise<string> {
    try {
        const response = await fetch(
            "https://github.com/login/oauth/access_token",
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code,
                    redirect_uri: GITHUB_REDIRECT_URI
                })
            }
        );

        if (!response.ok)
            throw new Error(`GitHub OAuth error: ${response.status}`);
        const data = (await response.json()) as GitHubTokenResponse;
        if (data.error)
            throw new Error(`GitHub OAuth error: ${data.error_description}`);
        if (!data.access_token)
            throw new Error("No access token received from GitHub");
        return data.access_token;
    } catch (error) {
        throw new Error(`Failed to exchange code for token: ${error}`);
    }
}
