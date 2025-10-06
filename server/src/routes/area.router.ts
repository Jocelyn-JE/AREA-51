import express from "express";
import { Request, Response } from "express";
import { db } from "../mongodb";
import { verifyToken } from "../utils/jwt";
import { ObjectId } from "mongodb";
import { isObjectId, objectExistsIn } from "../utils/db";

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

function isValidArea(req: Request, res: Response): Area | null {
    const actionServiceId = req.params.actionServiceId;
    const actionName = req.params.actionName;
    const reactionServiceId = req.params.reactionServiceId;
    const reactionName = req.params.reactionName;
    const userId = req.userId;
    if (
        !actionServiceId ||
        !actionName ||
        !reactionServiceId ||
        !reactionName ||
        !userId
    ) {
        res.status(400).json({
            error: "Missing area data. Required: actionServiceId, actionName, reactionServiceId, reactionName, userId"
        });
        return null;
    }
    if (
        isObjectId(actionServiceId) === false ||
        isObjectId(reactionServiceId) === false ||
        typeof actionName !== "string" ||
        typeof reactionName !== "string"
    ) {
        res.status(400).json({
            error: "Invalid area data types. Expected: actionServiceId (ObjectId), actionName (string), reactionServiceId (ObjectId), reactionName (string), userId (ObjectId)"
        });
        return null;
    }
    return {
        actionServiceId: new ObjectId(actionServiceId),
        actionName,
        reactionServiceId: new ObjectId(reactionServiceId),
        reactionName,
        userId: userId,
        createdAt: new Date()
    };
}

router.post(
    "/:actionServiceId/:actionName/:reactionServiceId/:reactionName",
    verifyToken,
    async (req, res) => {
        const newArea = isValidArea(req, res);
        if (newArea === null) return;
        try {
            const result = await db
                .collection<Area>("areas")
                .insertOne(newArea);
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
