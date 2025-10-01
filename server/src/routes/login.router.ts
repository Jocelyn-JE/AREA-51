import express from "express";
import { db } from "../mongodb";
import {
    validateJSONRequest,
    isValidEmail,
    areSomeEmpty,
    checkRequiredFields,
    checkAllowedFields,
    areAllEmpty,
    checkExactlyOneOfFields
} from "../utils/request.validation";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { User } from "./register.router";

const router = express.Router();

router.post("/", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkRequiredFields(req.body, res, ["password"]) ||
        checkExactlyOneOfFields(req.body, res, ["email", "username"]) ||
        checkAllowedFields(req.body, res, ["email", "username", "password"])
    )
        return;
    const { email: rawEmail, username: rawUsername, password } = req.body;
    if (areSomeEmpty(password) || areAllEmpty(rawEmail, rawUsername))
        return res.status(400).json({ error: "Password cannot be empty and either email or username must be provided" });

    let email = "";
    let username = "";

    if (rawEmail) email = rawEmail.toLowerCase().trim();
    if (rawUsername) username = rawUsername.trim();
    if (email && !isValidEmail(email))
        return res.status(400).json({ error: "Invalid email format" });
    try {
        const user =
            email !== ""
                ? await emailSearch(email)
                : await usernameSearch(username);
        if (!user || !(await comparePassword(password, user.password)))
            return res
                .status(401)
                .json({ error: "Invalid email, username, or password" });
        const token = generateToken(user._id);
        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

async function usernameSearch(username: string) {
    return await db.collection<User>("users").findOne({ username: username });
}

async function emailSearch(email: string) {
    return await db.collection<User>("users").findOne({ email: email });
}

function comparePassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export default router;
