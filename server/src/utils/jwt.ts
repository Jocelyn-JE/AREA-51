import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = 3600000; // Token expiration time in ms

interface JwtPayload {
    userId: ObjectId;
    expiresAt: number;
}

/**
 * Generates a JWT for a given user ID.
 *
 * @param userId - The user ID to include in the JWT payload.
 * @returns The generated JWT as a string.
 */
export function generateToken(userId: ObjectId): string {
    const payload: JwtPayload = {
        userId,
        expiresAt: Date.now() + JWT_EXPIRES_IN
    };
    return jwt.sign(payload, JWT_SECRET);
}

function verifyTokenInternal(token: string): JwtPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === "string") return null;
        return decoded as JwtPayload;
    } catch (err) {
        return null;
    }
}

declare global {
    namespace Express {
        interface Request {
            userId?: ObjectId;
        }
    }
}

/**
 * Express middleware that validates a Bearer JWT from the Authorization header.
 *
 * Flow:
 * 1. Expects an Authorization header in the form: "Bearer <token>".
 * 2. Verifies the token structure and signature.
 * 3. Ensures the payload contains a userId and an expiresAt timestamp.
 * 4. Rejects the request (401) if the token is missing, invalid, or expired.
 * 5. On success, augments the incoming request object with a non-standard property:
 *    (req as any).userId = <extracted userId>
 *
 * Security Notes:
 * - Assumes verifyTokenInternal performs signature & integrity checks.
 * - Ensures tokens with an expiresAt earlier than Date.now() are rejected.
 *
 * Error Responses:
 * - 401 { message: "No token provided" }
 * - 401 { message: "Invalid token" }
 * - 401 { message: "Token has expired" }
 *
 * Usage:
 *   app.use('/protected-route', verifyToken, handler);
 *
 * @param req - Incoming Express request; will be mutated to include req.userId on success.
 * @param res - Express response used to send 401 errors for auth failures.
 * @param next - Callback to pass control to the next middleware when authentication succeeds.
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).send({ message: "No token provided" });
    const token = authHeader.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).send({ message: "No token provided" });
    const payload = verifyTokenInternal(token);
    if (!payload || !payload.userId || !payload.expiresAt)
        return res.status(401).send({ message: "Invalid token" });
    if (payload.expiresAt < Date.now())
        return res.status(401).send({ message: "Token has expired" });
    // Attach user info to request object
    req.userId = payload.userId;
    next();
}
