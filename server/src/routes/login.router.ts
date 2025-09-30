import express from "express";
import { db } from "../mongodb";
import {
    validateJSONRequest,
    checkRequiredFields,
    isValidEmail,
    isEmpty
} from "../utils/request.validation";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcrypt";
import { User } from "./register.router";

const router = express.Router();

router.post("/", async (req, res) => {
    if (
        validateJSONRequest(req, res) ||
        checkRequiredFields(req.body, res, ["email", "password"])
    )
        return;
    const { email, password } = req.body as User;
    if (!isValidEmail(email))
        return res.status(400).json({ error: "Invalid email format" });
    if (isEmpty(email, password))
        return res
            .status(400)
            .json({ error: "Email and password cannot be empty" });
    try {
        const user = await db.collection<User>("users").findOne({ email });
        if (!user || !(await comparePassword(password, user.password)))
            return res.status(401).json({ error: "Invalid email or password" });
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
