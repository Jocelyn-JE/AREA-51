import express from "express";
import { db } from "../mongodb";
import {
    validateJSONRequest,
    isValidEmail,
    areSomeEmpty,
    checkRequiredFields,
    checkOneOfFields,
    checkAllowedFields,
    areAllEmpty
} from "../utils/request.validation";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { User } from "./register.router";

const router = express.Router();

router.post("/", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkRequiredFields(req.body, res, ["password"]) ||
        checkOneOfFields(req.body, res, ["email", "username"]) ||
        checkAllowedFields(req.body, res, ["email", "username", "password"])
    )
        return;
    var { email, username, password } = req.body;
    if (areSomeEmpty(password) || areAllEmpty(email, username))
        return res.status(400).json({ error: "Password cannot be empty" });
    email = email.toLowerCase().trim();
    username = username.trim();
    if (!isValidEmail(email))
        return res.status(400).json({ error: "Invalid email format" });
    try {
        const searchFilter = email
            ? { email: email.toLowerCase().trim() }
            : { username: username!.trim() };
        const user = await db.collection<User>("users").findOne(searchFilter);
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

function comparePassword(
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
}

export default router;
