import { MongoClient, Db } from "mongodb";

const dbClient = new MongoClient(
    process.env.DB_URL || "mongodb://localhost:27017"
);
const db: Db = dbClient.db(process.env.MONGO_DB || "database");

async function connectToDb(): Promise<boolean> {
    console.log("Connecting to DB...");
    try {
        await dbClient.connect();
        console.log("DB connected");
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
