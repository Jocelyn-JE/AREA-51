import express from "express";
import { db } from "../mongodb";
import { ObjectId } from "mongodb";

type ClientInfo = {
    host: string;
};

type Service = {
    _id: ObjectId;
    name: string;
    actions: { name: string; description: string }[];
    reactions: { name: string; description: string }[];
};

type ServerInfo = {
    current_time: number;
    services: Service[];
};

type AboutInfo = {
    client: ClientInfo;
    server: ServerInfo;
};

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
    const documents = await collection.find({}).toArray();
    return documents.map((doc) => ({
        _id: doc._id,
        name: doc.name,
        actions: doc.actions,
        reactions: doc.reactions
    }));
}

const router = express.Router();
const collection = db.collection("services");

router.use("/", async (req, res) => {
    const aboutInfo: AboutInfo = {
        client: getClientInfo(req),
        server: await getServerInfo()
    };
    res.status(200).json(aboutInfo);
});

export default router;
