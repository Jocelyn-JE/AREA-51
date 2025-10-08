import { db } from "../mongodb";
import { ObjectId } from "mongodb";

export type ClientInfo = {
    host: string;
};

// Legacy Area type was removed.
// New areas use AreaExecution type from services/area-engine.ts

/**
 * Checks if a string is a valid MongoDB ObjectId.
 *
 * @param id - The string to check.
 * @returns True if the string is a valid ObjectId, false otherwise.
 */
export const isObjectId = (id: string): boolean => {
    return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
};

/** Checks if an object with the given ID exists in the specified collection.
 *
 * @param collectionName - The name of the MongoDB collection.
 * @param id - The ObjectId to check for existence.
 * @returns A promise that resolves to true if the object exists, false otherwise.
 */
export const objectExistsIn = async (
    collectionName: string,
    id: ObjectId
): Promise<boolean> => {
    const resultDocument = await db
        .collection(collectionName)
        .findOne({ _id: id });
    return resultDocument !== null;
};
