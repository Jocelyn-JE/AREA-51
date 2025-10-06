import { db } from "../mongodb";
import { ObjectId } from "mongodb";

export type ClientInfo = {
    host: string;
};

export type Service = {
    _id: ObjectId;
    name: string;
    actions: { name: string; description: string }[];
    reactions: { name: string; description: string }[];
};

export type Area = {
    _id?: ObjectId;
    actionServiceId: ObjectId;
    actionName: string;
    reactionServiceId: ObjectId;
    reactionName: string;
    userId: ObjectId;
    createdAt: Date;
};

export type ServerInfo = {
    current_time: number;
    services: Service[];
};

export type AboutInfo = {
    client: ClientInfo;
    server: ServerInfo;
};

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
