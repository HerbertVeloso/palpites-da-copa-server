"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRoutes = void 0;
const prisma_1 = require("../lib/prisma");
async function usersRoutes(fastify) {
    fastify.get("/users/count", async (request, reply) => {
        try {
            const count = await prisma_1.prisma.user.count();
            return reply.status(200).send({ count });
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
}
exports.usersRoutes = usersRoutes;
