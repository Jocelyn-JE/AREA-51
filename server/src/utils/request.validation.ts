import { Request, Response } from "express";

export function validateJSONRequest(req: Request, res: Response) {
    console.debug("Validating JSON request");
    if (
        req.headers["content-type"] &&
        !req.headers["content-type"].includes("application/json")
    )
        return res
            .status(400)
            .json({ message: "Content-Type must be application/json" });
    if (!req.body || Object.keys(req.body).length === 0)
        return res.status(400).json({ message: "Request body is required" });
    if (typeof req.body !== "object")
        return res
            .status(400)
            .json({ message: "Request body must be valid JSON" });
    return null;
}

export function checkRequiredFields(
    body: any,
    res: Response,
    requiredFields: string[]
) {
    console.debug(`Checking required fields: ${requiredFields.join(", ")}`);
    const bodyKeys = Object.keys(body).sort();
    const requiredKeys = requiredFields.sort();
    if (JSON.stringify(bodyKeys) !== JSON.stringify(requiredKeys))
        return res.status(400).json({
            message:
                "Request body must contain exactly the required fields: " +
                requiredFields.join(", ")
        });
    return null;
}

export function checkAllowedFields(
    body: any,
    res: Response,
    allowedFields: string[]
) {
    console.debug(`Checking allowed fields: ${allowedFields.join(", ")}`);
    const bodyKeys = Object.keys(body).sort();
    if (bodyKeys.some((key) => !allowedFields.includes(key)))
        return res.status(400).json({
            message:
                "Request body contains invalid fields. Allowed fields are: " +
                allowedFields.join(", ")
        });
    if (bodyKeys.length === 0)
        return res.status(400).json({
            message: "Request body must contain at least one field to update."
        });
    return null;
}

// Check if any of the provided fields are empty or contain only whitespace
export function isEmpty(...fields: string[]): boolean {
    return fields.some((field) => !field || field.trim() === "");
}

// Simple email format validation
// Source: https://emailregex.com/
// Holy shit that's a long regex
export function isValidEmail(email: string): boolean {
    const emailRegex =
        /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    return emailRegex.test(email);
}
