import express from "express";
import { db } from "../mongodb";
import {
    validateJSONRequest,
    checkExactFields,
    isValidEmail,
    areSomeEmpty
} from "../utils/request.validation";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const router = express.Router();

export type User = {
    _id?: ObjectId;
    email: string;
    password: string | null;
    username: string;
    role?: string;
    googleId: string | null;
};

type RegisterRequest = {
    email: string;
    password: string;
    username: string;
};

router.post("/", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkExactFields(req.body, res, ["email", "username", "password"])
    )
        return;

    // Use const for password, let for fields that get reassigned
    let { email, username } = req.body as RegisterRequest;
    const { password } = req.body as RegisterRequest;

    email = email.toLowerCase().trim();
    username = username.trim();

    if (!isValidEmail(email))
        return res.status(400).json({ error: "Invalid email format" });
    if (areSomeEmpty(email, password, username))
        return res
            .status(400)
            .json({ error: "Email, password, and username cannot be empty" });
    if (await isEmailInUse(email))
        return res.status(409).json({ error: "Email is already in use" });
    if (await isUsernameInUse(username))
        return res.status(409).json({ error: "Username is already in use" });
    try {
        const result = await db.collection<User>("users").insertOne({
            email,
            password: await hashPassword(password),
            username,
            role: "user",
            googleId: null
        });
        res.status(201).json({
            message: "User registered successfully",
            userID: result.insertedId
        });
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

function hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
}

async function isEmailInUse(email: string): Promise<boolean> {
    return db
        .collection("users")
        .findOne({ email })
        .then((user) => !!user);
}

async function isUsernameInUse(username: string): Promise<boolean> {
    return db
        .collection("users")
        .findOne({ username })
        .then((user) => !!user);
}

export default router;
