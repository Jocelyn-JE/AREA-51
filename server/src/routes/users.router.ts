import express from "express";
import { verifyToken } from "../utils/jwt";
import { db } from "../mongodb";
import { User } from "./register.router";

const router = express.Router();

// GET /users/info
router.use("/info", verifyToken, async (req, res) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    try {
        const userInfo = await db
            .collection<User>("users")
            .findOne(
                { _id: req.userId },
                { projection: { password: 0, googleId: 0, githubId: 0 } }
            );
        if (!userInfo) return res.status(404).json({ error: "User not found" });
        res.status(200).json(userInfo);
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
