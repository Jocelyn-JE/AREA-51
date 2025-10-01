import express from "express";
import fs from "fs";
import path from "path";
import yaml from "yaml";
import swaggerUi from "swagger-ui-express";

const filePath = path.join(__dirname, "../../../docs/swagger.yaml");
const router = express.Router();
const swaggerOptions = {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Area 51 API Documentation"
};

// Reads and parses the swagger file
function getSwaggerConfigFile(): swaggerUi.JsonObject {
    const file = fs.readFileSync(filePath, "utf8");
    console.log("Swagger file loaded");
    return yaml.parse(file);
}

// Extend the Express Request interface
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            swaggerDoc?: swaggerUi.JsonObject;
        }
    }
}

// Reloads and serves the swagger file on each request
router.use(
    "/",
    function (
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) {
        if (req.path !== "/") return next();
        req.swaggerDoc = getSwaggerConfigFile();
        next();
    },
    swaggerUi.serve,
    swaggerUi.setup(undefined, swaggerOptions)
);

export default router;
