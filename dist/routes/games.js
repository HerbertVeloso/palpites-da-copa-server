"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gamesRoutes = void 0;
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const authenticate_1 = require("../plugins/authenticate");
async function gamesRoutes(fastify) {
    fastify.get("/pools/:id/games", {
        onRequest: [authenticate_1.authenticate],
    }, async (request, reply) => {
        try {
            const getPoolParams = zod_1.z.object({
                id: zod_1.z.string(),
            });
            const { id } = getPoolParams.parse(request.params);
            const games = await prisma_1.prisma.game.findMany({
                orderBy: {
                    date: "desc",
                },
                include: {
                    guesses: {
                        where: {
                            participant: {
                                userId: request.user.sub,
                                poolId: id,
                            },
                        },
                    },
                },
            });
            return reply.status(200).send({
                games: games.map((game) => {
                    return {
                        ...game,
                        guess: game.guesses.length > 0 ? game.guesses[0] : null,
                        guesses: undefined,
                    };
                }),
            });
        }
        catch (error) {
            return reply.status(400).send({ message: "Internal server error" });
        }
    });
}
exports.gamesRoutes = gamesRoutes;
