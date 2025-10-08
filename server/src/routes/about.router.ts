import express from "express";
import { serviceRegistry } from "../services";
import {
    ActionDefinition,
    BaseService,
    ReactionDefinition
} from "../services/types";

type ClientInfo = {
    host: string;
};

type ServiceInfo = {
    name: string;
    actions: ActionDefinition[];
    reactions: ReactionDefinition[];
};

type ServerInfo = {
    current_time: number;
    services: ServiceInfo[];
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

function getServerInfo(): ServerInfo {
    const services: ServiceInfo[] = Array.from(serviceRegistry.values()).map(
        (service: BaseService) => ({
            name: service.name,
            actions: service.actionDefinitions,
            reactions: service.reactionDefinitions
        })
    );

    return {
        current_time: Math.floor(Date.now() / 1000),
        services
    };
}

const router = express.Router();

router.use("/", async (req, res) => {
    const aboutInfo: AboutInfo = {
        client: getClientInfo(req),
        server: getServerInfo()
    };
    res.status(200).json(aboutInfo);
});

export default router;
