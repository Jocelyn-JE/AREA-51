import express from "express";
import { db } from "../mongodb";
import { isObjectId, verifyToken } from "../utils/jwt";
import { ObjectId } from "mongodb";

export type Area = {
    _id?: ObjectId;
    actionServiceId: ObjectId;
    actionName: string;
    reactionServiceId: ObjectId;
    reactionName: string;
    userId: ObjectId;
    createdAt: Date;
};

const router = express.Router();

router.post(
    "/:actionServiceId/:actionName/:reactionServiceId/:reactionName",
    verifyToken,
    async (req, res) => {
        const actionServiceId = req.params.actionServiceId;
        const actionName = req.params.actionName;
        const reactionServiceId = req.params.reactionServiceId;
        const reactionName = req.params.reactionName;
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });
        if (
            !actionServiceId ||
            !actionName ||
            !reactionServiceId ||
            !reactionName
        )
            return res.status(400).json({ error: "Missing parameters" });
        if (isObjectId(actionServiceId) === false)
            return res.status(400).json({ error: "Invalid actionServiceId" });
        if (isObjectId(reactionServiceId) === false)
            return res.status(400).json({ error: "Invalid reactionServiceId" });
        try {
            const result = await db.collection<Area>("areas").insertOne({
                actionServiceId: new ObjectId(actionServiceId),
                actionName,
                reactionServiceId: new ObjectId(reactionServiceId),
                reactionName,
                userId,
                createdAt: new Date()
            });
            return res
                .status(201)
                .json({ message: "Area created", areaId: result.insertedId });
        } catch (error) {
            console.error("Error creating area:", error);
            return res.status(500).json({ error: "Server error" });
        }
    }
);

router.delete("/:areaId", verifyToken, async (req, res) => {
    const areaId = req.params.areaId;
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!areaId) return res.status(400).json({ error: "Missing areaId" });
    if (isObjectId(areaId) === false)
        return res.status(400).json({ error: "Invalid areaId" });
    const _id = new ObjectId(areaId);
    try {
        const result = await db
            .collection<Area>("areas")
            .deleteOne({ _id, userId });
        if (result.deletedCount === 0)
            return res.status(404).json({
                error: "Area not found or you do not have permission to delete it"
            });
        return res.status(200).json({ message: "Area deleted" });
    } catch (error) {
        console.error("Error deleting area:", error);
        return res.status(500).json({ error: "Server error" });
    }
});

export default router;
