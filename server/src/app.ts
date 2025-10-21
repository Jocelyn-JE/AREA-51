import express from "express";
import cors from "cors";
import { connectToDb, closeDbConnection } from "./mongodb";
import { initializeAllServices } from "./services";
import { AreaEngine } from "./services/area-engine";

// Routes
import swaggerRouter from "./routes/swagger.router";
import aboutRouter from "./routes/about.router";
import registerRouter from "./routes/register.router";
import loginRouter from "./routes/login.router";
import googleAuthRouter from "./routes/google-auth.router";
import areaRouter from "./routes/area.router";
import githubAuthRouter from "./routes/github-auth.router";

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
// Google Auth route
app.use("/api/auth/google", googleAuthRouter);
// Github Auth route
app.use("/api/auth/github", githubAuthRouter);
// Area route
app.use("/api/areas", areaRouter);

app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
});

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// AREA scheduler function
function startAreaScheduler() {
    const POLL_INTERVAL = 60000; // Check every minute
    console.log(
        `🔄 Starting AREA scheduler (checking every ${POLL_INTERVAL / 1000}s)`
    );
    setInterval(async () => {
        try {
            console.log("🔍 Checking areas...");
            const engine = AreaEngine.getInstance();
            await engine.executeAllAreas();
        } catch (error) {
            console.error("❌ Error in AREA scheduler:", error);
        }
    }, POLL_INTERVAL);
}

async function run() {
    try {
        while (!(await connectToDb())) {
            console.log("Retrying DB connection in 2 seconds...");
            await sleep(2000);
        }
        // Initialize all services
        await initializeAllServices();
        // Start the AREA engine scheduler
        startAreaScheduler();
        process.on("SIGINT", async () => {
            await closeDbConnection();
            console.log("Goodbye!");
            process.exit(0);
        });
        console.log("Server is running\nPress Ctrl+C to exit");
    } catch (err) {
        console.log("Error occurred: ", err);
        await closeDbConnection();
        process.exit(1);
    }
}

run();
