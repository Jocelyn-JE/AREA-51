import express from "express";
import cors from "cors";
import { connectToDb, closeDbConnection } from "./mongodb";

// Routes
import swaggerRouter from "./routes/swagger.router";
import aboutRouter from "./routes/about.router";
import registerRouter from "./routes/register.router";
import loginRouter from "./routes/login.router";

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
console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
// Info route
app.get("/about.json", aboutRouter);
// Register route
app.use("/api/register", registerRouter);
// Login route
app.use("/api/login", loginRouter);

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
        setInterval(() => {
            // Polling logic for background tasks can be added here
            // Like checking for updates on external services for actions
            // and firing the reactions accordingly
        }, 5000); // Poll every 5 seconds (adjust as needed)
    } catch (err) {
        console.log("Error occurred: ", err);
        await closeDbConnection();
        process.exit(1);
    }
}

run();
