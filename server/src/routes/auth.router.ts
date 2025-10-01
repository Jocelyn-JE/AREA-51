import { OAuth2Client } from "google-auth-library";
import express from "express";
import { User } from "./register.router";
import { db } from "../mongodb";
import {
    checkExactFields,
    validateJSONRequest
} from "../utils/request.validation";
import { generateToken } from "../utils/jwt";

const CLIENT_ID =
    "210212748639-u6rbif83ca1uqkijrpc3iak87ajahrpd.apps.googleusercontent.com";
export const googleClient = new OAuth2Client(CLIENT_ID);

const router = express.Router();

router.post("/google/verify", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkExactFields(req.body, res, ["token"])
    )
        return;
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID
    });
    const payload = ticket.getPayload();
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

async function findOrCreateUser(
    email: string,
    name: string,
    googleId: string,
    res: express.Response
) {
    try {
        let user = (await db
            .collection<User>("users")
            .findOne({ email })) as User | null;
        if (user) {
            if (user.googleId !== googleId)
                return res.status(403).json({
                    error: "This email is already associated with another account"
                });
            if (!user._id) {
                console.error("User found without _id:", user);
                return res.status(500).json({ error: "Internal server error" });
            }
            // User exists and googleId matches, proceed to generate token
            return res.status(200).json({
                message: "Login successful",
                userID: user._id,
                token: generateToken(user._id)
            });
        } else {
            // User does not exist, create a new user
            user = await createUser(email, name, googleId);
            if (!user._id) {
                console.error("Created user missing _id:", user);
                return res.status(500).json({ error: "Internal server error" });
            }
            return res.status(201).json({
                message: "User created successfully",
                userID: user._id,
                token: generateToken(user._id)
            });
        }
    } catch (error) {
        console.error("Error accessing the database:", error);
        throw new Error("Internal server error");
    }
}

async function createUser(email: string, name: string, googleId: string) {
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

export default router;
