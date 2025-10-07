import express from "express";
import { Request, Response } from "express";
import { db } from "../mongodb";
import { verifyToken } from "../utils/jwt";
import { ObjectId } from "mongodb";
import { isObjectId, objectExistsIn, Service, Area } from "../utils/db";
import { validateJSONRequest } from "../utils/request.validation";

const router = express.Router();

async function serviceHasAction(
    serviceId: ObjectId,
    actionName: string
): Promise<boolean> {
    const service = await db
        .collection<Service>("services")
        .findOne({ _id: serviceId, "actions.name": actionName });
    return service !== null;
}

async function serviceHasReaction(
    serviceId: ObjectId,
    reactionName: string
): Promise<boolean> {
    const service = await db.collection<Service>("services").findOne({
        _id: serviceId,
        "reactions.name": reactionName
    });
    return service !== null;
}

async function isValidArea(
    req: Request,
    res: Response,
    userId: ObjectId
): Promise<Area | null> {
    const actionServiceId = req.params.actionServiceId;
    const actionName = req.params.actionName;
    const reactionServiceId = req.params.reactionServiceId;
    const reactionName = req.params.reactionName;
    const conditions: [boolean, string][] = [
        [!actionServiceId, "Missing actionServiceId"],
        [!actionName, "Missing actionName"],
        [!reactionServiceId, "Missing reactionServiceId"],
        [!reactionName, "Missing reactionName"],
        [!isObjectId(actionServiceId), "Invalid actionServiceId"],
        [!isObjectId(reactionServiceId), "Invalid reactionServiceId"],
        [typeof actionName !== "string", "Invalid actionName"],
        [typeof reactionName !== "string", "Invalid reactionName"],
        [
            !(await objectExistsIn("services", new ObjectId(actionServiceId))),
            "Action service does not exist"
        ],
        [
            !(await objectExistsIn(
                "services",
                new ObjectId(reactionServiceId)
            )),
            "Reaction service does not exist"
        ],
        [
            !(await serviceHasAction(
                new ObjectId(actionServiceId),
                actionName
            )),
            "Action service does not have the specified action"
        ],
        [
            !(await serviceHasReaction(
                new ObjectId(reactionServiceId),
                reactionName
            )),
            "Reaction service does not have the specified reaction"
        ]
    ];
    for (const [condition, errorMsg] of conditions) {
        if (condition) {
            res.status(400).json({ error: errorMsg });
            return null;
        }
    }
    if (!validateJSONRequest(req, res)) return null;
    const { actionOptions, reactionOptions } = req.body || {
        actionOptions: undefined,
        reactionOptions: undefined
    };
    return {
        actionServiceId: new ObjectId(actionServiceId),
        actionName,
        actionOptions,
        reactionServiceId: new ObjectId(reactionServiceId),
        reactionName,
        reactionOptions,
        userId: userId,
        createdAt: new Date()
    };
}

router.post(
    "/:actionServiceId/:actionName/:reactionServiceId/:reactionName",
    verifyToken,
    async (req, res) => {
        if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
        const newArea = await isValidArea(req, res, req.userId);
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
    if (!isObjectId(areaId))
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
