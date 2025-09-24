import express from "express";
import swaggerRouter from "./routes/swagger.router";
import cors from "cors";
import { connectToDb, closeDbConnection } from "./mongodb";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Home Page");
});

// Documentation route
app.use("/api-docs", swaggerRouter);

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function run() {
    try {
        while (!(await connectToDb())) {
            console.log("Retrying DB connection in 2 seconds...");
            await sleep(2000);
        }
        process.on("SIGINT", async () => {
            await closeDbConnection();
            console.log("Goodbye!");
            process.exit(0);
        });
        while (true) {
            // Polling logic for background tasks can be added here
            // Like checking for updates on external services for actions
            // and firing the reactions accordingly
        }
    } catch (err) {
        console.log("Error occurred: ", err);
        await closeDbConnection();
        process.exit(1);
    }
}

run();
