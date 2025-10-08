import express from "express";
import { Request, Response } from "express";
import { db } from "../mongodb";
import { verifyToken } from "../utils/jwt";
import { ObjectId } from "mongodb";
import {
    checkRequiredFields,
    validateJSONRequest
} from "../utils/request.validation";
import { getService } from "../services";
import { AreaExecution, areaEngine } from "../services/area-engine";

const router = express.Router();

interface CreateAreaRequest {
    actionServiceName: string;
    actionName: string;
    actionParameters: Record<string, unknown>;
    reactionServiceName: string;
    reactionName: string;
    reactionParameters: Record<string, unknown>;
    name?: string;
    description?: string;
}

// POST /areas - Create a new area
router.post("/", verifyToken, async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        if (validateJSONRequest(req, res)) return;

        const {
            actionServiceName,
            actionName,
            actionParameters,
            reactionServiceName,
            reactionName,
            reactionParameters
        } = req.body as CreateAreaRequest;

        // Basic validation
        if (
            checkRequiredFields(req.body, res, [
                "actionServiceName",
                "actionName",
                "reactionServiceName",
                "reactionName"
            ])
        )
            return;

        // Validate services exist
        const actionService = getService(actionServiceName);
        const reactionService = getService(reactionServiceName);

        if (!actionService) {
            // If action service is not found it will be undefined
            return res.status(400).json({
                error: `Action service '${actionServiceName}' not found`
            });
        }
        if (!reactionService) {
            // Same for reaction service
            return res.status(400).json({
                error: `Reaction service '${reactionServiceName}' not found`
            });
        }
        const newArea: AreaExecution = {
            actionServiceName,
            actionName,
            actionParameters: actionParameters || {},
            reactionServiceName,
            reactionName,
            reactionParameters: reactionParameters || {},
            userId: req.userId,
            enabled: true, // Areas are enabled by default
            createdAt: new Date()
        };
        const validationErrors = await areaEngine.validateArea(newArea);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: `Area validation failed: ${validationErrors.join(", ")}`
            });
        }
        // Insert into database
        const result = await db
            .collection<AreaExecution>("areas")
            .insertOne(newArea);
        res.status(201).json({
            message: "Area created successfully",
            area: {
                _id: result.insertedId,
                ...newArea
            }
        });
    } catch (error) {
        console.error("Error creating area:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// GET /areas - Get user's areas
router.get("/", verifyToken, async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    try {
        const areas = await db
            .collection<AreaExecution>("areas")
            .find({ userId: req.userId })
            .toArray();
        res.status(200).json({ areas });
    } catch (error) {
        console.error("Error fetching areas:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// PUT /areas/:id/toggle - Enable/disable an area
router.put("/:id/toggle", verifyToken, async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
    try {
        const areaId = req.params.id;
        if (!ObjectId.isValid(areaId))
            return res.status(400).json({ error: "Invalid area ID" });
        const { enabled } = req.body;
        if (typeof enabled !== "boolean")
            return res
                .status(400)
                .json({ error: "'enabled' must be a boolean" });
        const result = await db
            .collection<AreaExecution>("areas")
            .updateOne(
                { _id: new ObjectId(areaId), userId: req.userId },
                { $set: { enabled } }
            );
        if (result.matchedCount === 0)
            return res.status(404).json({ error: "Area not found" });
        res.status(200).json({
            message: `Area ${enabled ? "enabled" : "disabled"} successfully`
        });
    } catch (error) {
        console.error("Error toggling area:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /areas/:id/execute - Manually execute an area
router.post(
    "/:id/execute",
    verifyToken,
    async (req: Request, res: Response) => {
        if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

        try {
            const areaId = req.params.id;
            if (!ObjectId.isValid(areaId)) {
                return res.status(400).json({ error: "Invalid area ID" });
            }

            // Verify area belongs to user
            const area = await db.collection<AreaExecution>("areas").findOne({
                _id: new ObjectId(areaId),
                userId: new ObjectId(req.userId)
            });

            if (!area) {
                return res.status(404).json({ error: "Area not found" });
            }

            // Execute the area
            await areaEngine.executeArea(new ObjectId(areaId));

            res.json({ message: "Area executed successfully" });
        } catch (error) {
            console.error("Error executing area:", error);
            res.status(500).json({
                error: "Failed to execute area",
                details:
                    error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
);

// DELETE /areas/:id - Delete an area
router.delete("/:id", verifyToken, async (req: Request, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    try {
        const areaId = req.params.id;
        if (!ObjectId.isValid(areaId))
            return res.status(400).json({ error: "Invalid area ID" });
        const result = await db.collection<AreaExecution>("areas").deleteOne({
            _id: new ObjectId(areaId),
            userId: req.userId
        });
        if (result.deletedCount === 0)
            return res.status(404).json({ error: "Area not found" });
        res.status(200).json({ message: "Area deleted successfully" });
    } catch (error) {
        console.error("Error deleting area:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /test/reaction - Test a reaction
router.post(
    "/test/reaction",
    verifyToken,
    async (req: Request, res: Response) => {
        if (!req.userId) return res.status(401).json({ error: "Unauthorized" });
        try {
            if (validateJSONRequest(req, res)) return;
            const { serviceName, reactionName, parameters } = req.body;
            if (!serviceName || !reactionName) {
                return res.status(400).json({
                    error: "serviceName and reactionName are required"
                });
            }
            await areaEngine.executeReaction(
                serviceName,
                reactionName,
                parameters || {}
            );
            res.status(200).json({ message: "Reaction executed successfully" });
        } catch (error) {
            console.error("Error testing reaction:", error);
            res.status(500).json({
                error: "Failed to test reaction",
                details:
                    error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
);

export default router;
