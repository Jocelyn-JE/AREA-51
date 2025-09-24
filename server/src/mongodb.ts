import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

dotenvExpand.expand(dotenv.config());

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB || "database";
const dbClient = new MongoClient(dbUrl);
const db: Db = dbClient.db(dbName);

async function connectToDb(): Promise<boolean> {
    console.log(`Connecting to DB... at ${dbUrl}`);
    try {
        await dbClient.connect();
        console.log(`DB connected, active on database: ${dbName}`);
        return true;
    } catch (err: any) {
        console.log(`DB connection error: ${err.message}`);
        return false;
    }
}

async function closeDbConnection(): Promise<void> {
    console.log("Closing DB connection...");
    try {
        await dbClient.close();
        console.log("DB connection closed");
    } catch (err) {
        console.log("Error closing DB connection: ", err);
    }
}

export { dbClient, db, connectToDb, closeDbConnection };
