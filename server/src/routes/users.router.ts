import express from "express";
import { ObjectId } from "mongodb";
import { verifyToken } from "../utils/jwt";
import { db } from "../mongodb";
import { User } from "./register.router";

const router = express.Router();

// GET /users/info
router.get("/info", verifyToken, async (req, res) => {
    try {
        const userObjectId = typeof req.userId === "string" 
            ? new ObjectId(req.userId) 
            : req.userId;

        const user = await db.collection<User>("users").findOne(
            { _id: userObjectId },
            { projection: { password: 0, googleId: 0, githubId: 0 } }
        );
        res.send(user);
    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).send({ message: "Internal server error" });
    }
});

export default router;
