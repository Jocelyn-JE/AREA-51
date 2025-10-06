import { db } from "../mongodb";
import { ObjectId } from "mongodb";

/**
 * Checks if a string is a valid MongoDB ObjectId.
 *
 * @param id - The string to check.
 * @returns True if the string is a valid ObjectId, false otherwise.
 */
export const isObjectId = (id: string): boolean => {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};
