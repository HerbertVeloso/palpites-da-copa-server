"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolsRoutes = void 0;
const zod_1 = require("zod");
const short_unique_id_1 = __importDefault(require("short-unique-id"));
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../plugins/authenticate");
async function poolsRoutes(fastify) {
    fastify.get("/pools/count", async (request, reply) => {
        const count = await prisma_1.prisma.pool.count();
        return { count };
    });
    fastify.post("/pools", async (request, reply) => {
        const createPoolBody = zod_1.z.object({
            title: zod_1.z.string(),
        });
        const { title } = createPoolBody.parse(request.body);
        const generate = new short_unique_id_1.default({ length: 6 });
        const code = String(generate()).toUpperCase();
        try {
            await request.jwtVerify();
            await prisma_1.prisma.pool.create({
                data: {
                    title,
                    code,
                    ownerId: request.user.sub,
                    participants: {
                        create: {
                            userId: request.user.sub,
                        },
                    },
                },
            });
        }
        catch {
            await prisma_1.prisma.pool.create({
                data: {
                    title,
                    code,
                },
            });
        }
        return reply.status(201).send({ code });
    });
    fastify.post("/pools/join", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        try {
            const joinPoolBody = zod_1.z.object({
                code: zod_1.z.string(),
            });
            const { code } = joinPoolBody.parse(request.body);
            const pool = await prisma_1.prisma.pool.findUnique({
                where: {
                    code,
                },
                include: {
                    participants: {
                        where: {
                            userId: request.user.sub,
                        },
                    },
                },
            });
            if (!pool) {
                return reply.status(400).send({ message: "Pool not found" });
            }
            if (pool.participants.length > 0) {
                return reply
                    .status(400)
                    .send({ message: "You already joined this pool" });
            }
            if (!pool.ownerId) {
                await prisma_1.prisma.pool.update({
                    where: {
                        id: pool.id,
                    },
                    data: {
                        ownerId: request.user.sub,
                    },
                });
            }
            await prisma_1.prisma.participant.create({
                data: {
                    poolId: pool.id,
                    userId: request.user.sub,
                },
            });
            return reply.status(201).send();
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
    fastify.get("/pools", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        try {
            const pools = await prisma_1.prisma.pool.findMany({
                where: {
                    participants: {
                        some: {
                            userId: request.user.sub,
                        },
                    },
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                    participants: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    avatarUrl: true,
                                },
                            },
                        },
                        take: 4,
                    },
                    owner: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            return reply.status(200).send({ pools });
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
    fastify.get("/pools/:id", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        try {
            const getPoolParams = zod_1.z.object({
                id: zod_1.z.string(),
            });
            const { id } = getPoolParams.parse(request.params);
            const pool = await prisma_1.prisma.pool.findUnique({
                where: {
                    id,
                },
                include: {
                    _count: {
                        select: {
                            participants: true,
                        },
                    },
                    participants: {
                        select: {
                            id: true,
                            user: {
                                select: {
                                    avatarUrl: true,
                                },
                            },
                        },
                        take: 4,
                    },
                    owner: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            });
            return reply.status(200).send({ pool });
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
}
exports.poolsRoutes = poolsRoutes;
