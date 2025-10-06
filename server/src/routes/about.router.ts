import express from "express";
import { db } from "../mongodb";
import { Service, AboutInfo, ClientInfo, ServerInfo } from "../utils/db";

function getClientInfo(req: express.Request): ClientInfo {
    return {
        host: req.hostname || req.ip || req.socket.remoteAddress || "<unknown>"
    };
}

async function getServerInfo(): Promise<ServerInfo> {
    return {
        current_time: Math.floor(Date.now() / 1000),
        services: await getServices()
    };
}

async function getServices(): Promise<Service[]> {
    const documents = await services.find().toArray();
    return documents;
}

const router = express.Router();
const services = db.collection<Service>("services");

router.use("/", async (req, res) => {
    const aboutInfo: AboutInfo = {
        client: getClientInfo(req),
        server: await getServerInfo()
    };
    res.status(200).json(aboutInfo);
});

export default router;
