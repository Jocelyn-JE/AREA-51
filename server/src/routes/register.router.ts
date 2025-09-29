import express from "express";
import { db } from "../mongodb";
import {
    validateJSONRequest,
    checkRequiredFields,
    isValidEmail,
    isEmpty
} from "../utils/request.validation";
import bcrypt from "bcrypt";
import { InsertOneResult } from "mongodb";

const router = express.Router();
const requiredFields = ["email", "password"];

type User = {
    _id?: string;
    email: string;
    password: string;
    role?: string;
};

router.post("/", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkRequiredFields(req.body, res, requiredFields)
    )
        return;
    const { email, password } = req.body as User;
    if (!isValidEmail(email))
        return res.status(400).json({ error: "Invalid email format" });
    if (isEmpty(email, password))
        return res
            .status(400)
            .json({ error: "Email and password cannot be empty" });
    if (await isEmailInUse(email))
        return res.status(409).json({ error: "Email is already in use" });
    try {
        const result: InsertOneResult<User> = await db
            .collection("users")
            .insertOne({
                email,
                password: await hashPassword(password),
                role: "user"
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

export default router;
