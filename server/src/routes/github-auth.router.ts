import express from "express";
import { User } from "./register.router";
import { db } from "../mongodb";
import {
    checkExactFields,
    validateJSONRequest
} from "../utils/request.validation";
import { generateToken, verifyToken } from "../utils/jwt";
import {
    verifyGithubToken,
    getGithubOAuthUrl,
    exchangeCodeForToken
} from "../utils/github.auth";
import { OAuthToken } from "../utils/google.auth";
import { ObjectId } from "mongodb";
import { OAuthTokenManager } from "../services/oauth-token-manager";

const router = express.Router();

async function findOrCreateUser(
    email: string,
    name: string,
    githubId: string,
    res: express.Response
) {
    let user = (await db
        .collection<User>("users")
        .findOne({ email })) as User | null;
    let message = "Login successful";
    let statusCode = 200;
    if (user) {
        if (user.githubId !== githubId)
            return res.status(403).json({
                error: "This email is already associated with another account"
            });
        if (!user._id) {
            console.error("User found without _id:", user);
            return res.status(500).json({ error: "Internal server error" });
        }
    } else {
        // User does not exist, create a new user
        user = await createGithubUser(email, name, githubId);
        if (!user._id) {
            console.error("Created user missing _id:", user);
            return res.status(500).json({ error: "Internal server error" });
        }
        message = "User created and logged in successfully";
        statusCode = 201;
    }
    return res
        .status(statusCode)
        .json({ message, userID: user._id, token: generateToken(user._id) });
}

async function createGithubUser(email: string, name: string, githubId: string) {
    try {
        const newUser: User = {
            email,
            password: null,
            username: name,
            role: "user",
            githubId
        };
        const createdUser = await db
            .collection<User>("users")
            .insertOne(newUser);
        return { ...newUser, _id: createdUser.insertedId };
    } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Internal server error");
    }
}

// POST /auth/github/verify - Verify GitHub access token and login/register user
router.post("/verify", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkExactFields(req.body, res, ["token"])
    )
        return;
    const { token } = req.body;
    const payload = await verifyGithubToken(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });
    const email = payload.email; // user's email
    const name = payload.name; // user's full name
    const githubId = payload.id; // GitHub unique user ID
    if (!email || !name || !githubId)
        return res.status(400).json({ error: "Incomplete token payload" });
    try {
        return await findOrCreateUser(email, name, githubId, res);
    } catch (error) {
        console.error("Error in GitHub login:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

const scopes = [
    "repo",
    "user",
    "admin:org"
    // Add other scopes you need for your AREA services
];

// GET /auth/github/authorize - Initiate OAuth2 flow for service permissions
router.get("/authorize", verifyToken, async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    if (
        (await OAuthTokenManager.getInstance().getTokensForUser(
            new ObjectId(req.userId),
            "github"
        )) !== null
    )
        return res
            .status(400)
            .json({ message: "GitHub services already authorized" });
    try {
        const authUrl = getGithubOAuthUrl(req.userId.toString(), scopes);
        res.status(200).json({ authUrl });
    } catch (error) {
        console.error("Error generating GitHub OAuth URL:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// GET /auth/github/callback - Handle OAuth2 callback
router.get("/callback", async (req, res) => {
    const { code, state: userId } = req.query;
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) throw new Error("FRONTEND_URL not set in env");

    if (!code || !userId || typeof userId !== "string") {
        return res
            .status(400)
            .json({ error: "Missing authorization code or user ID" });
    }

    try {
        // Exchange authorization code for tokens
        const access_token = await exchangeCodeForToken(code.toString());

        if (!access_token) {
            return res
                .status(400)
                .json({ error: "Failed to get access token" });
        }

        // Store tokens in your oauth_tokens collection
        const tokenData: OAuthToken = {
            userId: new ObjectId(userId),
            serviceName: "github",
            accessToken: access_token,
            refreshToken: undefined,
            expiresAt: undefined,
            scopes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db
            .collection<OAuthToken>("oauth_tokens")
            .updateOne(
                { userId: tokenData.userId, serviceName: "github" },
                { $set: tokenData },
                { upsert: true }
            );
        // Redirect back to frontend with success
        res.redirect(`${frontendUrl}/dashboard?github_auth=success`);
    } catch (error) {
        console.error("Error in GitHub OAuth callback:", error);
        res.redirect(`${frontendUrl}/dashboard?github_auth=error`);
    }
});

export default router;
