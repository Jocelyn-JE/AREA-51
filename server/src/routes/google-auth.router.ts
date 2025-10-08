import express from "express";
import { User } from "./register.router";
import { db } from "../mongodb";
import {
    checkExactFields,
    validateJSONRequest
} from "../utils/request.validation";
import { generateToken, verifyToken } from "../utils/jwt";
import {
    verifyGoogleToken,
    oauth2Client,
    OAuthToken
} from "../utils/google.auth";
import { ObjectId } from "mongodb";

const router = express.Router();

async function findOrCreateUser(
    email: string,
    name: string,
    googleId: string,
    res: express.Response
) {
    let user = (await db
        .collection<User>("users")
        .findOne({ email })) as User | null;
    let message = "Login successful";
    let statusCode = 200;
    if (user) {
        if (user.googleId !== googleId)
            return res.status(403).json({
                error: "This email is already associated with another account"
            });
        if (!user._id) {
            console.error("User found without _id:", user);
            return res.status(500).json({ error: "Internal server error" });
        }
    } else {
        // User does not exist, create a new user
        user = await createGoogleUser(email, name, googleId);
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

async function createGoogleUser(email: string, name: string, googleId: string) {
    try {
        const newUser: User = {
            email,
            password: null,
            username: name,
            role: "user",
            googleId
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

// POST /auth/google/verify - Verify Google ID token and login/register user
router.post("/verify", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkExactFields(req.body, res, ["token"])
    )
        return;
    const { token } = req.body;
    const payload = await verifyGoogleToken(token);
    if (!payload) return res.status(401).json({ error: "Invalid token" });
    const email = payload.email; // user's email
    const name = payload.name; // user's full name
    const googleId = payload.sub; // Google unique user ID
    if (!email || !name || !googleId)
        return res.status(400).json({ error: "Incomplete token payload" });
    try {
        return await findOrCreateUser(email, name, googleId, res);
    } catch (error) {
        console.error("Error in Google login:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

// GET /auth/google/authorize - Initiate OAuth2 flow for service permissions
router.get("/authorize", verifyToken, async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const scopes = [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive.readonly",
        "https://www.googleapis.com/auth/calendar.readonly"
        // Add other scopes you need for your AREA services
    ];
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline", // Important: gets refresh token
        scope: scopes,
        state: req.userId.toString(), // Pass userId to identify user in callback
        prompt: "consent" // Forces consent screen to get refresh token
    });
    res.status(200).json({ authUrl });
});

// GET /auth/google/callback - Handle OAuth2 callback
router.get("/callback", async (req, res) => {
    const { code, state: userId } = req.query;

    if (!code || !userId || typeof userId !== "string") {
        return res
            .status(400)
            .json({ error: "Missing authorization code or user ID" });
    }

    try {
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code as string);

        if (!tokens.access_token) {
            return res
                .status(400)
                .json({ error: "Failed to get access token" });
        }

        // Store tokens in your oauth_tokens collection
        const tokenData: OAuthToken = {
            userId: new ObjectId(userId),
            serviceName: "google",
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiresAt: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : undefined,
            scopes: Array.isArray(tokens.scope)
                ? tokens.scope
                : tokens.scope?.split(" ") || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db
            .collection<OAuthToken>("oauth_tokens")
            .updateOne(
                { userId: tokenData.userId, serviceName: "google" },
                { $set: tokenData },
                { upsert: true }
            );
        // Redirect back to frontend with success
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) throw new Error("FRONTEND_URL not set in env");
        res.redirect(`${frontendUrl}/dashboard?google_auth=success`);
    } catch (error) {
        console.error("Error in Google OAuth callback:", error);
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) throw new Error("FRONTEND_URL not set in env");
        res.redirect(`${frontendUrl}/dashboard?google_auth=error`);
    }
});

export default router;
